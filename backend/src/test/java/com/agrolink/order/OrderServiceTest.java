package com.agrolink.order;

import com.agrolink.cart.CartService;
import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ConflictException;
import com.agrolink.common.exception.ServiceUnavailableException;
import com.agrolink.notification.NotificationService;
import com.agrolink.order.dto.OrderItemRequest;
import com.agrolink.order.dto.OrderResponse;
import com.agrolink.order.dto.PaymentResponse;
import com.agrolink.order.dto.VerifyPaymentRequest;
import com.agrolink.product.ProductService;
import com.agrolink.product.dto.ProductResponse;
import com.agrolink.security.UserPrincipal;
import com.agrolink.user.UserRole;
import com.agrolink.user.UserService;
import com.agrolink.user.dto.UserProfileDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    private static final String BUYER = "buyer-1";
    private static final UserPrincipal BUYER_PRINCIPAL = new UserPrincipal(BUYER, "buyer", "x", UserRole.BUYER, false);

    @Mock OrderRepository orderRepository;
    @Mock ProductService productService;
    @Mock CartService cartService;
    @Mock UserService userService;
    @Mock NotificationService notificationService;
    @Mock PaymentGateway paymentGateway;
    @Mock NanoIdGenerator nanoIdGenerator;

    OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, productService, cartService, userService,
                notificationService, paymentGateway, nanoIdGenerator);
        ReflectionTestUtils.setField(orderService, "pendingExpiryMinutes", 30L);
        lenient().when(paymentGateway.isConfigured()).thenReturn(true);
        lenient().when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private static ProductResponse product(String id, double price) {
        return new ProductResponse(id, "farmer-1", "Product " + id, "VEGETABLE", price, 100, List.of(), null, null);
    }

    private static Order order(OrderStatus status) {
        return Order.builder()
                .id("order-1").buyerId(BUYER).status(status).amount(50.0).razorpayOrderId("rzp-order-1")
                .items(List.of(new OrderItem("p1", "Product p1", 2, 25.0)))
                .build();
    }

    @Test
    void ordersArePricedFromTheCatalogueAndReserveStock() {
        when(productService.getProduct("p1")).thenReturn(product("p1", 10.10));
        when(productService.getProduct("p2")).thenReturn(product("p2", 5.0));
        when(nanoIdGenerator.generateOrderId()).thenReturn("order-1");
        when(paymentGateway.createOrder(anyLong(), anyString())).thenReturn("rzp-order-1");
        when(paymentGateway.getKeyId()).thenReturn("rzp_key");

        PaymentResponse response = orderService.createOrder(BUYER,
                List.of(new OrderItemRequest("p1", 3), new OrderItemRequest("p2", 2), new OrderItemRequest("p1", 1)));

        // p1: 4 x 10.10 = 40.40, p2: 2 x 5.00 = 10.00  ->  50.40 = 5040 paise
        assertThat(response.amount()).isEqualTo(5040L);
        assertThat(response.orderId()).isEqualTo("order-1");
        assertThat(response.razorpayOrderId()).isEqualTo("rzp-order-1");
        verify(productService).reserveStock("p1", 4);
        verify(productService).reserveStock("p2", 2);
        verify(paymentGateway).createOrder(5040L, "order-1");

        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(saved.getValue().getBuyerId()).isEqualTo(BUYER);
        assertThat(saved.getValue().getAmount()).isEqualTo(50.40);
    }

    @Test
    void stockAlreadyReservedIsReleasedWhenALaterItemIsOutOfStock() {
        when(productService.getProduct("p1")).thenReturn(product("p1", 10));
        when(productService.getProduct("p2")).thenReturn(product("p2", 10));
        lenient().doThrow(new ConflictException("Insufficient stock")).when(productService).reserveStock("p2", 5);

        assertThatThrownBy(() -> orderService.createOrder(BUYER,
                List.of(new OrderItemRequest("p1", 1), new OrderItemRequest("p2", 5))))
                .isInstanceOf(ConflictException.class);

        verify(productService).releaseStock("p1", 1);
        verify(productService, never()).releaseStock(eq("p2"), anyInt());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void stockIsReleasedWhenThePaymentProviderFails() {
        when(productService.getProduct("p1")).thenReturn(product("p1", 10));
        when(nanoIdGenerator.generateOrderId()).thenReturn("order-1");
        when(paymentGateway.createOrder(anyLong(), anyString())).thenThrow(new ServiceUnavailableException("down"));

        assertThatThrownBy(() -> orderService.createOrder(BUYER, List.of(new OrderItemRequest("p1", 2))))
                .isInstanceOf(ServiceUnavailableException.class);

        verify(productService).releaseStock("p1", 2);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void refusesToOrderWhenPaymentsAreNotConfiguredOrTheOrderIsEmpty() {
        assertThatThrownBy(() -> orderService.createOrder(BUYER, List.of())).isInstanceOf(BadRequestException.class);

        when(paymentGateway.isConfigured()).thenReturn(false);
        assertThatThrownBy(() -> orderService.createOrder(BUYER, List.of(new OrderItemRequest("p1", 1))))
                .isInstanceOf(ServiceUnavailableException.class);
        verify(productService, never()).reserveStock(anyString(), anyInt());
    }

    @Test
    void aValidSignatureMarksTheOrderPaidClearsTheCartAndNotifiesTheBuyer() {
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order(OrderStatus.PENDING)));
        when(paymentGateway.verifySignature("rzp-order-1", "pay_1", "sig")).thenReturn(true);
        when(userService.getById(BUYER)).thenReturn(
                new UserProfileDTO(BUYER, "buyer", "buyer@example.com", null, "BUYER", null, null, false, false));

        OrderResponse response = orderService.verifyPayment("order-1", BUYER_PRINCIPAL, new VerifyPaymentRequest("pay_1", "sig"));

        assertThat(response.status()).isEqualTo(OrderStatus.PAID);
        verify(cartService).removeProducts(BUYER, List.of("p1"));
        verify(notificationService).sendEmailQuietly(eq("buyer@example.com"), anyString(), anyString());
    }

    @Test
    void aForgedSignatureLeavesTheOrderPending() {
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order(OrderStatus.PENDING)));
        when(paymentGateway.verifySignature(anyString(), anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> orderService.verifyPayment("order-1", BUYER_PRINCIPAL, new VerifyPaymentRequest("pay_1", "forged")))
                .isInstanceOf(BadRequestException.class);

        verify(orderRepository, never()).save(any());
        verify(cartService, never()).removeProducts(anyString(), any());
    }

    @Test
    void verifyingAnAlreadyPaidOrderIsIdempotent() {
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order(OrderStatus.PAID)));

        OrderResponse response = orderService.verifyPayment("order-1", BUYER_PRINCIPAL, new VerifyPaymentRequest("pay_1", "sig"));

        assertThat(response.status()).isEqualTo(OrderStatus.PAID);
        verify(paymentGateway, never()).verifySignature(anyString(), anyString(), anyString());
    }

    @Test
    void cancellingAPendingOrderReleasesItsStock() {
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order(OrderStatus.PENDING)));

        OrderResponse response = orderService.cancel("order-1", BUYER_PRINCIPAL);

        assertThat(response.status()).isEqualTo(OrderStatus.CANCELLED);
        verify(productService).releaseStock("p1", 2);
    }

    @Test
    void aPaidOrderCannotBeCancelled() {
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order(OrderStatus.PAID)));

        assertThatThrownBy(() -> orderService.cancel("order-1", BUYER_PRINCIPAL)).isInstanceOf(ConflictException.class);
        verify(productService, never()).releaseStock(anyString(), anyInt());
    }

    @Test
    void ordersOfOtherUsersAreOffLimitsExceptForAdmins() {
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order(OrderStatus.PENDING)));
        UserPrincipal stranger = new UserPrincipal("someone-else", "eve", "x", UserRole.BUYER, false);
        UserPrincipal admin = new UserPrincipal("admin-1", "root", "x", UserRole.ADMIN, false);

        assertThatThrownBy(() -> orderService.getOrder("order-1", stranger)).isInstanceOf(AccessDeniedException.class);
        assertThat(orderService.getOrder("order-1", admin).id()).isEqualTo("order-1");
    }

    @Test
    void unpaidOrdersPastTheDeadlineAreCancelledAndTheirStockReleased() {
        Order stale = order(OrderStatus.PENDING);
        when(orderRepository.findByStatusAndCreatedAtBefore(eq(OrderStatus.PENDING), any(Instant.class)))
                .thenReturn(List.of(stale));

        orderService.expireStaleOrders();

        assertThat(stale.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(productService).releaseStock("p1", 2);
    }
}
