package com.agrolink.rfq;

import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ConflictException;
import com.agrolink.notification.NotificationService;
import com.agrolink.order.OrderLine;
import com.agrolink.order.OrderService;
import com.agrolink.order.OrderStatus;
import com.agrolink.order.dto.OrderResponse;
import com.agrolink.order.dto.PaymentResponse;
import com.agrolink.product.ProductService;
import com.agrolink.product.dto.ProductResponse;
import com.agrolink.rfq.dto.CreateRfqRequest;
import com.agrolink.rfq.dto.RfqResponse;
import com.agrolink.rfq.dto.SubmitQuoteRequest;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RfqServiceTest {

    static final UserPrincipal BUYER = new UserPrincipal("buyer-1", "buyer", "x", UserRole.BUYER, false);
    static final UserPrincipal SELLER = new UserPrincipal("farmer-1", "farmer", "x", UserRole.FARMER, false);
    static final UserPrincipal STRANGER = new UserPrincipal("other-1", "other", "x", UserRole.BUYER, false);
    static final UserPrincipal ADMIN = new UserPrincipal("admin-1", "root", "x", UserRole.ADMIN, false);

    @Mock RfqRepository rfqRepository;
    @Mock ProductService productService;
    @Mock UserService userService;
    @Mock OrderService orderService;
    @Mock NotificationService notificationService;

    RfqService rfqService;

    @BeforeEach
    void setUp() {
        rfqService = new RfqService(rfqRepository, productService, userService, orderService, notificationService);
        lenient().when(rfqRepository.save(any(Rfq.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(userService.getById("farmer-1")).thenReturn(profile("farmer-1", "farmer"));
    }

    private static UserProfileDTO profile(String id, String username) {
        return new UserProfileDTO(id, username, null, null, "FARMER", null, null, false, false);
    }

    private static ProductResponse product() {
        return new ProductResponse("p1", "farmer-1", "Tomato", "VEGETABLE", 20.0, 1000, List.of(), null, null);
    }

    private static CreateRfqRequest request(LocalDate deadline) {
        return new CreateRfqRequest("p1", 500, "kg", 18.0, "Pune market", LocalDate.now().plusDays(10), "Grade A only", deadline);
    }

    private Rfq stored(RfqStatus status) {
        return Rfq.builder().id("rfq-1").productId("p1").productName("Tomato")
                .buyerId("buyer-1").buyerName("buyer").sellerId("farmer-1").sellerName("farmer")
                .quantity(500).unit("kg").deliveryLocation("Pune market")
                .deadline(LocalDate.now().plusDays(5)).status(status).build();
    }

    private void givenStored(Rfq rfq) {
        when(rfqRepository.findById("rfq-1")).thenReturn(Optional.of(rfq));
    }

    private static SubmitQuoteRequest quote() {
        return new SubmitQuoteRequest(17.5, 500, LocalDate.now().plusDays(7), "Ex-farm price");
    }

    // ---- create ---------------------------------------------------------

    @Test
    void creatingAnRfqAddressesItToTheProductsSellerAndTellsThem() {
        when(productService.getProduct("p1")).thenReturn(product());

        RfqResponse rfq = rfqService.create(BUYER, request(LocalDate.now().plusDays(3)));

        assertThat(rfq.status()).isEqualTo(RfqStatus.OPEN);
        assertThat(rfq.sellerId()).isEqualTo("farmer-1");
        assertThat(rfq.sellerName()).isEqualTo("farmer");
        assertThat(rfq.buyerId()).isEqualTo("buyer-1");
        assertThat(rfq.productName()).isEqualTo("Tomato");
        verify(notificationService).notifyUser(eq("farmer-1"), anyString(), anyString());
    }

    @Test
    void theUnitDefaultsToKilograms() {
        when(productService.getProduct("p1")).thenReturn(product());
        CreateRfqRequest noUnit = new CreateRfqRequest("p1", 5, " ", null, "Pune", null, null, LocalDate.now().plusDays(1));

        assertThat(rfqService.create(BUYER, noUnit).unit()).isEqualTo("kg");
    }

    @Test
    void youCannotRequestAQuoteOnYourOwnProduct() {
        when(productService.getProduct("p1")).thenReturn(product());

        assertThatThrownBy(() -> rfqService.create(SELLER, request(LocalDate.now().plusDays(3))))
                .isInstanceOf(BadRequestException.class);
        verify(rfqRepository, never()).save(any());
    }

    @Test
    void datesInThePastAreRejected() {
        when(productService.getProduct("p1")).thenReturn(product());

        assertThatThrownBy(() -> rfqService.create(BUYER, request(LocalDate.now().minusDays(1))))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("deadline");
        CreateRfqRequest pastDelivery = new CreateRfqRequest("p1", 5, "kg", null, "Pune", LocalDate.now().minusDays(1), null, LocalDate.now().plusDays(1));
        assertThatThrownBy(() -> rfqService.create(BUYER, pastDelivery))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("delivery");
    }

    // ---- quote ----------------------------------------------------------

    @Test
    void theSellerQuotesAnOpenRfqAndTheBuyerIsTold() {
        givenStored(stored(RfqStatus.OPEN));

        RfqResponse rfq = rfqService.submitQuote("rfq-1", SELLER, quote());

        assertThat(rfq.status()).isEqualTo(RfqStatus.QUOTED);
        assertThat(rfq.quote().getPricePerUnit()).isEqualTo(17.5);
        assertThat(rfq.quote().getQuotedAt()).isNotNull();
        verify(notificationService).notifyUser(eq("buyer-1"), anyString(), anyString());
    }

    @Test
    void theSellerMayReplaceTheirQuoteBeforeItIsAnswered() {
        Rfq rfq = stored(RfqStatus.QUOTED);
        rfq.setQuote(new Quote(19.0, 500, null, null, null));
        givenStored(rfq);

        assertThat(rfqService.submitQuote("rfq-1", SELLER, quote()).quote().getPricePerUnit()).isEqualTo(17.5);
    }

    @Test
    void onlyTheSellerCanQuote() {
        givenStored(stored(RfqStatus.OPEN));

        assertThatThrownBy(() -> rfqService.submitQuote("rfq-1", BUYER, quote())).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> rfqService.submitQuote("rfq-1", STRANGER, quote())).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> rfqService.submitQuote("rfq-1", ADMIN, quote())).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void noQuotingAfterTheBuyerHasAcceptedOrTheRequestIsClosed() {
        for (RfqStatus closed : List.of(RfqStatus.ACCEPTED, RfqStatus.REJECTED, RfqStatus.CANCELLED)) {
            givenStored(stored(closed));
            assertThatThrownBy(() -> rfqService.submitQuote("rfq-1", SELLER, quote())).isInstanceOf(ConflictException.class);
        }
    }

    // ---- accept / reject / cancel --------------------------------------

    @Test
    void theBuyerAcceptsAQuoteAndTheSellerIsTold() {
        givenStored(stored(RfqStatus.QUOTED));

        assertThat(rfqService.accept("rfq-1", BUYER).status()).isEqualTo(RfqStatus.ACCEPTED);
        verify(notificationService).notifyUser(eq("farmer-1"), anyString(), anyString());
    }

    @Test
    void theBuyerCanRejectAQuote() {
        givenStored(stored(RfqStatus.QUOTED));

        assertThat(rfqService.reject("rfq-1", BUYER).status()).isEqualTo(RfqStatus.REJECTED);
    }

    @Test
    void nothingToAcceptUntilThereIsAQuote() {
        givenStored(stored(RfqStatus.OPEN));

        assertThatThrownBy(() -> rfqService.accept("rfq-1", BUYER)).isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> rfqService.reject("rfq-1", BUYER)).isInstanceOf(ConflictException.class);
    }

    @Test
    void theSellerAndStrangersCannotAcceptRejectOrCancel() {
        givenStored(stored(RfqStatus.QUOTED));

        assertThatThrownBy(() -> rfqService.accept("rfq-1", SELLER)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> rfqService.reject("rfq-1", STRANGER)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> rfqService.cancel("rfq-1", SELLER)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void theBuyerCancelsWhileOpenOrQuotedButNotAfterAccepting() {
        givenStored(stored(RfqStatus.OPEN));
        assertThat(rfqService.cancel("rfq-1", BUYER).status()).isEqualTo(RfqStatus.CANCELLED);

        givenStored(stored(RfqStatus.QUOTED));
        assertThat(rfqService.cancel("rfq-1", BUYER).status()).isEqualTo(RfqStatus.CANCELLED);

        givenStored(stored(RfqStatus.ACCEPTED));
        assertThatThrownBy(() -> rfqService.cancel("rfq-1", BUYER)).isInstanceOf(ConflictException.class);
    }

    // ---- expiry ---------------------------------------------------------

    @Test
    void anRfqPastItsDeadlineExpiresAndCanNoLongerBeActedOn() {
        Rfq late = stored(RfqStatus.QUOTED);
        late.setDeadline(LocalDate.now().minusDays(1));
        givenStored(late);

        assertThat(rfqService.get("rfq-1", BUYER).status()).isEqualTo(RfqStatus.EXPIRED);
        assertThatThrownBy(() -> rfqService.accept("rfq-1", BUYER)).isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> rfqService.submitQuote("rfq-1", SELLER, quote())).isInstanceOf(ConflictException.class);
    }

    @Test
    void anAcceptedRfqDoesNotExpire() {
        Rfq accepted = stored(RfqStatus.ACCEPTED);
        accepted.setDeadline(LocalDate.now().minusDays(30));
        givenStored(accepted);

        assertThat(rfqService.get("rfq-1", BUYER).status()).isEqualTo(RfqStatus.ACCEPTED);
    }

    // ---- visibility -----------------------------------------------------

    @Test
    void onlyThePartiesAndAdminsCanViewAnRfq() {
        givenStored(stored(RfqStatus.OPEN));

        assertThat(rfqService.get("rfq-1", BUYER).id()).isEqualTo("rfq-1");
        assertThat(rfqService.get("rfq-1", SELLER).id()).isEqualTo("rfq-1");
        assertThat(rfqService.get("rfq-1", ADMIN).id()).isEqualTo("rfq-1");
        assertThatThrownBy(() -> rfqService.get("rfq-1", STRANGER)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void listingShowsMyRfqsAsBuyerOrSellerAndAdminsSeeEverything() {
        when(rfqRepository.findByBuyerIdOrSellerIdOrderByCreatedAtDesc("farmer-1", "farmer-1")).thenReturn(List.of(stored(RfqStatus.OPEN)));
        when(rfqRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(stored(RfqStatus.OPEN), stored(RfqStatus.QUOTED)));

        assertThat(rfqService.list(SELLER)).hasSize(1);
        assertThat(rfqService.list(ADMIN)).hasSize(2);
    }

    // ---- ordering the accepted quote -----------------------------------

    private static PaymentResponse payment() {
        return new PaymentResponse("order-1", "rzp-1", "rzp_key", "INR", 875000L);
    }

    private Rfq accepted() {
        Rfq rfq = stored(RfqStatus.ACCEPTED);
        rfq.setQuote(new Quote(17.5, 500, LocalDate.now().plusDays(7), null, null));
        return rfq;
    }

    @Test
    void orderingAnAcceptedQuoteUsesTheQuotedPriceAndQuantity() {
        givenStored(accepted());
        when(orderService.placeOrder(eq("buyer-1"), any())).thenReturn(payment());

        PaymentResponse response = rfqService.createOrder("rfq-1", BUYER);

        assertThat(response.orderId()).isEqualTo("order-1");
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<OrderLine>> lines = ArgumentCaptor.forClass(List.class);
        verify(orderService).placeOrder(eq("buyer-1"), lines.capture());
        assertThat(lines.getValue()).containsExactly(new OrderLine("p1", "Tomato", "farmer-1", 500, 17.5));

        ArgumentCaptor<Rfq> saved = ArgumentCaptor.forClass(Rfq.class);
        verify(rfqRepository).save(saved.capture());
        assertThat(saved.getValue().getOrderId()).isEqualTo("order-1");
    }

    @Test
    void youCannotOrderBeforeAcceptingOrTwice() {
        givenStored(stored(RfqStatus.QUOTED));
        assertThatThrownBy(() -> rfqService.createOrder("rfq-1", BUYER)).isInstanceOf(ConflictException.class);

        for (OrderStatus blocking : List.of(OrderStatus.PENDING, OrderStatus.PAID)) {
            Rfq rfq = accepted();
            rfq.setOrderId("order-0");
            givenStored(rfq);
            when(orderService.getOrder(eq("order-0"), any())).thenReturn(orderResponse(blocking));

            assertThatThrownBy(() -> rfqService.createOrder("rfq-1", BUYER)).isInstanceOf(ConflictException.class);
        }
        verify(orderService, never()).placeOrder(anyString(), any());
    }

    @Test
    void afterTheEarlierOrderWasCancelledOrExpiredANewOneCanBeCreated() {
        Rfq rfq = accepted();
        rfq.setOrderId("order-0");
        givenStored(rfq);
        when(orderService.getOrder(eq("order-0"), any())).thenReturn(orderResponse(OrderStatus.CANCELLED));
        when(orderService.placeOrder(eq("buyer-1"), any())).thenReturn(payment());

        assertThat(rfqService.createOrder("rfq-1", BUYER).orderId()).isEqualTo("order-1");
    }

    @Test
    void onlyTheBuyerCanOrder() {
        givenStored(accepted());

        assertThatThrownBy(() -> rfqService.createOrder("rfq-1", SELLER)).isInstanceOf(AccessDeniedException.class);
    }

    private static OrderResponse orderResponse(OrderStatus status) {
        return new OrderResponse("order-0", "buyer-1", List.of(), 0, status, "rzp", null, null);
    }
}
