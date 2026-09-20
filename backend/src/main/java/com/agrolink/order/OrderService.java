package com.agrolink.order;

import com.agrolink.cart.CartService;
import com.agrolink.cart.dto.CartResponse;
import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ConflictException;
import com.agrolink.common.exception.ResourceNotFoundException;
import com.agrolink.common.exception.ServiceUnavailableException;
import com.agrolink.notification.NotificationService;
import com.agrolink.order.dto.OrderItemRequest;
import com.agrolink.order.dto.OrderResponse;
import com.agrolink.order.dto.PaymentResponse;
import com.agrolink.order.dto.SellerOrderResponse;
import com.agrolink.order.dto.VerifyPaymentRequest;
import com.agrolink.product.ProductService;
import com.agrolink.product.dto.ProductResponse;
import com.agrolink.security.UserPrincipal;
import com.agrolink.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Order lifecycle: PENDING (stock reserved, awaiting payment) -> PAID, or CANCELLED (stock released).
 * Stock is reserved when the order is created so a buyer who reaches the payment step cannot be beaten to the last units.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final CartService cartService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final PaymentGateway paymentGateway;
    private final NanoIdGenerator nanoIdGenerator;

    @Value("${app.orders.pending-expiry-minutes:30}")
    private long pendingExpiryMinutes;

    public PaymentResponse createOrder(String buyerId, List<OrderItemRequest> requested) {
        if (requested == null || requested.isEmpty()) {
            throw new BadRequestException("An order needs at least one item");
        }
        requirePayments();

        Map<String, Integer> quantities = new LinkedHashMap<>();
        for (OrderItemRequest item : requested) {
            if (item.quantity() <= 0) {
                throw new BadRequestException("Quantity must be greater than 0");
            }
            quantities.merge(item.productId(), item.quantity(), Integer::sum);
        }

        List<OrderLine> lines = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : quantities.entrySet()) {
            ProductResponse product = productService.getProduct(entry.getKey());
            lines.add(new OrderLine(product.id(), product.name(), product.farmerId(), entry.getValue(), product.pricePerUnit()));
        }
        return placeOrder(buyerId, lines);
    }

    /**
     * Reserves stock, creates the Razorpay order and saves a PENDING order for lines whose prices are already decided:
     * catalogue prices for normal orders, the accepted quote for orders that come from an RFQ.
     */
    public PaymentResponse placeOrder(String buyerId, List<OrderLine> lines) {
        requirePayments();

        List<OrderItem> reserved = new ArrayList<>();
        try {
            for (OrderLine line : lines) {
                productService.reserveStock(line.productId(), line.quantity());
                reserved.add(new OrderItem(line.productId(), line.productName(), line.quantity(), line.unitPrice(), line.sellerId()));
            }

            BigDecimal total = reserved.stream()
                    .map(item -> BigDecimal.valueOf(item.getUnitPrice()).multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            long amountInPaise = total.movePointRight(2).longValueExact();

            String orderId = nanoIdGenerator.generateOrderId();
            String razorpayOrderId = paymentGateway.createOrder(amountInPaise, orderId);

            orderRepository.save(Order.builder()
                    .id(orderId)
                    .buyerId(buyerId)
                    .items(reserved)
                    .amount(total.doubleValue())
                    .status(OrderStatus.PENDING)
                    .razorpayOrderId(razorpayOrderId)
                    .build());

            return new PaymentResponse(orderId, razorpayOrderId, paymentGateway.getKeyId(), PaymentGateway.CURRENCY, amountInPaise);
        } catch (RuntimeException e) {
            reserved.forEach(this::releaseQuietly);
            throw e;
        }
    }

    private void requirePayments() {
        if (!paymentGateway.isConfigured()) {
            throw new ServiceUnavailableException(PaymentGateway.UNAVAILABLE_MESSAGE);
        }
    }

    public PaymentResponse checkoutCart(String buyerId) {
        CartResponse cart = cartService.getCart(buyerId);
        if (cart.items().isEmpty()) {
            throw new BadRequestException("Your cart is empty");
        }
        return createOrder(buyerId, cart.items().stream()
                .map(item -> new OrderItemRequest(item.getProductId(), item.getQuantity()))
                .toList());
    }

    public OrderResponse verifyPayment(String orderId, UserPrincipal actor, VerifyPaymentRequest request) {
        Order order = getOrderFor(orderId, actor);

        if (order.getStatus() == OrderStatus.PAID) {
            return OrderResponse.from(order);
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ConflictException("This order has been cancelled");
        }
        if (!paymentGateway.verifySignature(order.getRazorpayOrderId(), request.razorpayPaymentId(), request.razorpaySignature())) {
            throw new BadRequestException("Invalid payment signature");
        }

        order.setStatus(OrderStatus.PAID);
        order.setRazorpayPaymentId(request.razorpayPaymentId());
        order = orderRepository.save(order);

        cartService.removeProducts(order.getBuyerId(), order.getItems().stream().map(OrderItem::getProductId).toList());
        notifyBuyer(order);
        notifyParties(order);
        return OrderResponse.from(order);
    }

    public OrderResponse cancel(String orderId, UserPrincipal actor) {
        Order order = getOrderFor(orderId, actor);
        if (order.getStatus() == OrderStatus.PAID) {
            throw new ConflictException("Paid orders cannot be cancelled");
        }
        if (order.getStatus() == OrderStatus.PENDING) {
            order = cancelAndRelease(order);
        }
        return OrderResponse.from(order);
    }

    /** Orders that contain the seller's products, showing only that seller's lines. */
    public List<SellerOrderResponse> getSellerOrders(String sellerId) {
        Map<String, String> buyerNames = new HashMap<>();
        return orderRepository.findByItemsSellerIdOrderByCreatedAtDesc(sellerId).stream()
                .map(order -> SellerOrderResponse.from(order, sellerId,
                        buyerNames.computeIfAbsent(order.getBuyerId(), this::buyerName)))
                .toList();
    }

    public List<OrderResponse> getMyOrders(String buyerId) {
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId).stream().map(OrderResponse::from).toList();
    }

    public OrderResponse getOrder(String orderId, UserPrincipal actor) {
        return OrderResponse.from(getOrderFor(orderId, actor));
    }

    /** Frees the stock held by orders that were never paid. */
    @Scheduled(initialDelayString = "${app.orders.expiry-check-ms:300000}", fixedDelayString = "${app.orders.expiry-check-ms:300000}")
    public void expireStaleOrders() {
        try {
            Instant cutoff = Instant.now().minus(Duration.ofMinutes(pendingExpiryMinutes));
            for (Order order : orderRepository.findByStatusAndCreatedAtBefore(OrderStatus.PENDING, cutoff)) {
                cancelAndRelease(order);
                log.info("Expired unpaid order {}", order.getId());
            }
        } catch (RuntimeException e) {
            log.warn("Could not expire stale orders: {}", e.getMessage());
        }
    }

    private Order cancelAndRelease(Order order) {
        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);
        saved.getItems().forEach(this::releaseQuietly);
        return saved;
    }

    private void releaseQuietly(OrderItem item) {
        try {
            productService.releaseStock(item.getProductId(), item.getQuantity());
        } catch (RuntimeException e) {
            log.error("Could not release {} units of product {}", item.getQuantity(), item.getProductId(), e);
        }
    }

    private Order getOrderFor(String orderId, UserPrincipal actor) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        if (!actor.isAdmin() && !actor.getId().equals(order.getBuyerId())) {
            throw new AccessDeniedException("You can only access your own orders");
        }
        return order;
    }

    private String buyerName(String buyerId) {
        try {
            return userService.getById(buyerId).username();
        } catch (RuntimeException e) {
            return "unknown buyer";
        }
    }

    private void notifyParties(Order order) {
        notificationService.notifyUser(order.getBuyerId(), "Payment received",
                String.format("Your payment of INR %.2f for order %s was received.", order.getAmount(), order.getId()));
        order.getItems().stream().map(OrderItem::getSellerId).filter(StringUtils::hasText).distinct()
                .forEach(sellerId -> notificationService.notifyUser(sellerId, "New paid order",
                        "You have a new paid order (" + order.getId() + ") for your products."));
    }

    private void notifyBuyer(Order order) {
        try {
            String email = userService.getById(order.getBuyerId()).email();
            if (StringUtils.hasText(email)) {
                notificationService.sendEmailQuietly(email, "Payment received for order " + order.getId(),
                        String.format("Thank you! We received your payment of INR %.2f for order %s.",
                                order.getAmount(), order.getId()));
            }
        } catch (RuntimeException e) {
            log.warn("Could not notify buyer {} about order {}: {}", order.getBuyerId(), order.getId(), e.getMessage());
        }
    }
}
