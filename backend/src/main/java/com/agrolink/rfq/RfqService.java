package com.agrolink.rfq;

import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ConflictException;
import com.agrolink.common.exception.ResourceNotFoundException;
import com.agrolink.notification.NotificationService;
import com.agrolink.order.OrderLine;
import com.agrolink.order.OrderService;
import com.agrolink.order.OrderStatus;
import com.agrolink.order.dto.PaymentResponse;
import com.agrolink.product.ProductService;
import com.agrolink.product.dto.ProductResponse;
import com.agrolink.rfq.dto.CreateRfqRequest;
import com.agrolink.rfq.dto.RfqResponse;
import com.agrolink.rfq.dto.SubmitQuoteRequest;
import com.agrolink.security.UserPrincipal;
import com.agrolink.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Request-for-quote workflow: OPEN -> QUOTED -> ACCEPTED -> (order at the quoted price), or REJECTED / CANCELLED / EXPIRED.
 * Every state change is decided here; the client only asks for it.
 */
@Service
@RequiredArgsConstructor
public class RfqService {

    private static final String DEFAULT_UNIT = "kg";

    private final RfqRepository rfqRepository;
    private final ProductService productService;
    private final UserService userService;
    private final OrderService orderService;
    private final NotificationService notificationService;

    public RfqResponse create(UserPrincipal buyer, CreateRfqRequest request) {
        ProductResponse product = productService.getProduct(request.productId());
        if (!StringUtils.hasText(product.farmerId())) {
            throw new BadRequestException("This product has no seller to send a request to");
        }
        if (product.farmerId().equals(buyer.getId())) {
            throw new BadRequestException("You cannot request a quote for your own product");
        }
        LocalDate today = LocalDate.now();
        if (request.deadline().isBefore(today)) {
            throw new BadRequestException("The deadline cannot be in the past");
        }
        if (request.requiredDeliveryDate() != null && request.requiredDeliveryDate().isBefore(today)) {
            throw new BadRequestException("The required delivery date cannot be in the past");
        }

        Rfq saved = rfqRepository.save(Rfq.builder()
                .productId(product.id())
                .productName(product.name())
                .buyerId(buyer.getId())
                .buyerName(buyer.getUsername())
                .sellerId(product.farmerId())
                .sellerName(sellerName(product.farmerId()))
                .quantity(request.quantity())
                .unit(StringUtils.hasText(request.unit()) ? request.unit().trim() : DEFAULT_UNIT)
                .targetPricePerUnit(request.targetPricePerUnit())
                .deliveryLocation(request.deliveryLocation().trim())
                .requiredDeliveryDate(request.requiredDeliveryDate())
                .requirements(request.requirements())
                .deadline(request.deadline())
                .status(RfqStatus.OPEN)
                .build());

        notificationService.notifyUser(saved.getSellerId(), "New quote request",
                String.format("%s asked for a quote on %d %s of %s.", buyer.getUsername(), saved.getQuantity(), saved.getUnit(), saved.getProductName()));
        return RfqResponse.from(saved);
    }

    /** RFQs the caller is part of (as buyer or seller); admins see all. */
    public List<RfqResponse> list(UserPrincipal actor) {
        List<Rfq> rfqs = actor.isAdmin()
                ? rfqRepository.findAllByOrderByCreatedAtDesc()
                : rfqRepository.findByBuyerIdOrSellerIdOrderByCreatedAtDesc(actor.getId(), actor.getId());
        return rfqs.stream().map(this::refreshExpiry).map(RfqResponse::from).toList();
    }

    public RfqResponse get(String id, UserPrincipal actor) {
        Rfq rfq = refreshExpiry(find(id));
        if (!actor.isAdmin() && !isBuyer(rfq, actor) && !isSeller(rfq, actor)) {
            throw new AccessDeniedException("You can only view your own quote requests");
        }
        return RfqResponse.from(rfq);
    }

    /** The seller answers (or replaces an earlier answer) while the RFQ is still OPEN or QUOTED. */
    public RfqResponse submitQuote(String id, UserPrincipal actor, SubmitQuoteRequest request) {
        Rfq rfq = refreshExpiry(find(id));
        if (!isSeller(rfq, actor)) {
            throw new AccessDeniedException("Only the seller of this product can quote");
        }
        requireStatus(rfq, "quoted", RfqStatus.OPEN, RfqStatus.QUOTED);
        if (request.deliveryDate() != null && request.deliveryDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("The delivery date cannot be in the past");
        }

        rfq.setQuote(new Quote(request.pricePerUnit(), request.quantity(), request.deliveryDate(), request.notes(), Instant.now()));
        rfq.setStatus(RfqStatus.QUOTED);
        Rfq saved = rfqRepository.save(rfq);

        notificationService.notifyUser(saved.getBuyerId(), "Quote received",
                String.format("%s quoted INR %.2f per %s for %s.", saved.getSellerName(), request.pricePerUnit(), saved.getUnit(), saved.getProductName()));
        return RfqResponse.from(saved);
    }

    public RfqResponse accept(String id, UserPrincipal actor) {
        Rfq rfq = buyerRfq(id, actor);
        requireStatus(rfq, "accepted", RfqStatus.QUOTED);
        rfq.setStatus(RfqStatus.ACCEPTED);
        Rfq saved = rfqRepository.save(rfq);
        notificationService.notifyUser(saved.getSellerId(), "Quote accepted",
                String.format("%s accepted your quote for %s.", saved.getBuyerName(), saved.getProductName()));
        return RfqResponse.from(saved);
    }

    public RfqResponse reject(String id, UserPrincipal actor) {
        Rfq rfq = buyerRfq(id, actor);
        requireStatus(rfq, "rejected", RfqStatus.QUOTED);
        rfq.setStatus(RfqStatus.REJECTED);
        Rfq saved = rfqRepository.save(rfq);
        notificationService.notifyUser(saved.getSellerId(), "Quote rejected",
                String.format("%s rejected your quote for %s.", saved.getBuyerName(), saved.getProductName()));
        return RfqResponse.from(saved);
    }

    public RfqResponse cancel(String id, UserPrincipal actor) {
        Rfq rfq = buyerRfq(id, actor);
        requireStatus(rfq, "cancelled", RfqStatus.OPEN, RfqStatus.QUOTED);
        rfq.setStatus(RfqStatus.CANCELLED);
        Rfq saved = rfqRepository.save(rfq);
        notificationService.notifyUser(saved.getSellerId(), "Quote request cancelled",
                String.format("%s cancelled the request for %s.", saved.getBuyerName(), saved.getProductName()));
        return RfqResponse.from(saved);
    }

    /**
     * Creates the order for an accepted quote, priced from the quote (not the catalogue), and returns what the browser
     * needs to pay. If an earlier order for this RFQ expired or was cancelled, a new one can be created.
     */
    public PaymentResponse createOrder(String id, UserPrincipal actor) {
        Rfq rfq = buyerRfq(id, actor);
        requireStatus(rfq, "ordered", RfqStatus.ACCEPTED);

        if (rfq.getOrderId() != null) {
            OrderStatus existing = orderService.getOrder(rfq.getOrderId(), actor).status();
            if (existing == OrderStatus.PAID) {
                throw new ConflictException("This quote has already been paid");
            }
            if (existing == OrderStatus.PENDING) {
                throw new ConflictException("An order for this quote is already waiting for payment: " + rfq.getOrderId());
            }
        }

        Quote quote = rfq.getQuote();
        PaymentResponse payment = orderService.placeOrder(actor.getId(), List.of(
                new OrderLine(rfq.getProductId(), rfq.getProductName(), rfq.getSellerId(), quote.getQuantity(), quote.getPricePerUnit())));
        rfq.setOrderId(payment.orderId());
        rfqRepository.save(rfq);
        return payment;
    }

    private Rfq buyerRfq(String id, UserPrincipal actor) {
        Rfq rfq = refreshExpiry(find(id));
        if (!isBuyer(rfq, actor)) {
            throw new AccessDeniedException("Only the buyer who created this request can do that");
        }
        return rfq;
    }

    private void requireStatus(Rfq rfq, String action, RfqStatus... allowed) {
        for (RfqStatus status : allowed) {
            if (rfq.getStatus() == status) {
                return;
            }
        }
        throw new ConflictException("This request cannot be " + action + " while it is " + rfq.getStatus());
    }

    /** Moves an unanswered or unaccepted RFQ to EXPIRED once its deadline has passed. */
    private Rfq refreshExpiry(Rfq rfq) {
        boolean open = rfq.getStatus() == RfqStatus.OPEN || rfq.getStatus() == RfqStatus.QUOTED;
        if (open && rfq.getDeadline() != null && rfq.getDeadline().isBefore(LocalDate.now())) {
            rfq.setStatus(RfqStatus.EXPIRED);
            return rfqRepository.save(rfq);
        }
        return rfq;
    }

    private Rfq find(String id) {
        return rfqRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote request not found with id: " + id));
    }

    private boolean isBuyer(Rfq rfq, UserPrincipal actor) {
        return actor.getId().equals(rfq.getBuyerId());
    }

    private boolean isSeller(Rfq rfq, UserPrincipal actor) {
        return actor.getId().equals(rfq.getSellerId());
    }

    private String sellerName(String sellerId) {
        try {
            return userService.getById(sellerId).username();
        } catch (RuntimeException e) {
            return "seller";
        }
    }
}
