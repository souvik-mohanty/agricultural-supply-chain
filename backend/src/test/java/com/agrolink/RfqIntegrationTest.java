package com.agrolink;

import com.agrolink.notification.Notification;
import com.agrolink.notification.NotificationRepository;
import com.agrolink.order.Order;
import com.agrolink.order.OrderItem;
import com.agrolink.order.OrderRepository;
import com.agrolink.order.OrderStatus;
import com.agrolink.product.Product;
import com.agrolink.product.ProductRepository;
import com.agrolink.rfq.Rfq;
import com.agrolink.rfq.RfqRepository;
import com.agrolink.security.JwtUtil;
import com.agrolink.user.User;
import com.agrolink.user.UserRepository;
import com.agrolink.user.UserRole;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The RFQ workflow, the notification inbox and seller-side orders through the real HTTP layer (security rules, JSON
 * dates, error bodies). The repositories are replaced by small in-memory fakes, so no MongoDB is needed.
 */
@SpringBootTest(properties = "spring.data.mongodb.auto-index-creation=false")
@AutoConfigureMockMvc
class RfqIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired JwtUtil jwtUtil;

    @MockitoBean UserRepository userRepository;
    @MockitoBean ProductRepository productRepository;
    @MockitoBean RfqRepository rfqRepository;
    @MockitoBean NotificationRepository notificationRepository;
    @MockitoBean OrderRepository orderRepository;

    final Map<String, User> users = new LinkedHashMap<>();
    final Map<String, Rfq> rfqs = new LinkedHashMap<>();
    final List<Notification> notifications = new ArrayList<>();
    final List<Order> orders = new ArrayList<>();

    @BeforeEach
    void wireFakes() {
        addUser("u-buyer", "buyer", UserRole.BUYER);
        addUser("u-buyer2", "buyer2", UserRole.BUYER);
        addUser("u-farmer", "farmer", UserRole.FARMER);
        addUser("u-farmer2", "farmer2", UserRole.FARMER);
        addUser("u-admin", "root", UserRole.ADMIN);
        when(userRepository.findByUsername(anyString())).thenAnswer(inv ->
                users.values().stream().filter(u -> u.getUsername().equals(inv.getArgument(0))).findFirst());
        when(userRepository.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(users.get(inv.<String>getArgument(0))));

        Product tomato = Product.builder().id("p1").farmerId("u-farmer").name("Tomato").category("VEGETABLE")
                .pricePerUnit(20.0).quantityAvailable(1000).build();
        when(productRepository.findById("p1")).thenReturn(Optional.of(tomato));

        when(rfqRepository.save(any(Rfq.class))).thenAnswer(inv -> {
            Rfq rfq = inv.getArgument(0);
            if (rfq.getId() == null) rfq.setId("rfq-" + (rfqs.size() + 1));
            rfqs.put(rfq.getId(), rfq);
            return rfq;
        });
        when(rfqRepository.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(rfqs.get(inv.<String>getArgument(0))));
        when(rfqRepository.findByBuyerIdOrSellerIdOrderByCreatedAtDesc(anyString(), anyString())).thenAnswer(inv ->
                rfqs.values().stream().filter(r -> r.getBuyerId().equals(inv.getArgument(0)) || r.getSellerId().equals(inv.getArgument(1))).toList());
        when(rfqRepository.findAllByOrderByCreatedAtDesc()).thenAnswer(inv -> new ArrayList<>(rfqs.values()));

        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            if (n.getId() == null) n.setId("n-" + (notifications.size() + 1));
            if (!notifications.contains(n)) notifications.add(n);
            return n;
        });
        when(notificationRepository.findTop50ByUserIdOrderByTimestampDesc(anyString())).thenAnswer(inv ->
                notifications.stream().filter(n -> inv.getArgument(0).equals(n.getUserId()))
                        .sorted(Comparator.comparing(Notification::getTimestamp).reversed()).toList());
        when(notificationRepository.countByUserIdAndReadFalse(anyString())).thenAnswer(inv ->
                notifications.stream().filter(n -> inv.getArgument(0).equals(n.getUserId()) && !n.isRead()).count());
        when(notificationRepository.findById(anyString())).thenAnswer(inv ->
                notifications.stream().filter(n -> n.getId().equals(inv.getArgument(0))).findFirst());
        when(notificationRepository.findByUserIdAndReadFalse(anyString())).thenAnswer(inv ->
                notifications.stream().filter(n -> inv.getArgument(0).equals(n.getUserId()) && !n.isRead()).toList());
        when(notificationRepository.saveAll(anyIterable())).thenAnswer(inv -> inv.getArgument(0));

        when(orderRepository.findByItemsSellerIdOrderByCreatedAtDesc(anyString())).thenAnswer(inv ->
                orders.stream().filter(o -> o.getItems().stream().anyMatch(i -> inv.getArgument(0).equals(i.getSellerId()))).toList());
    }

    private void addUser(String id, String username, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setPassword("x");
        user.setRole(role);
        users.put(id, user);
    }

    private String bearer(String userId) {
        User user = users.get(userId);
        return "Bearer " + jwtUtil.generateToken(user.getUsername(), user.getRole().name());
    }

    private String rfqJson(LocalDate deadline) {
        return """
                {"productId":"p1","quantity":500,"unit":"kg","targetPricePerUnit":18.0,
                 "deliveryLocation":"Pune market","requiredDeliveryDate":"%s",
                 "requirements":"Grade A only","deadline":"%s"}""".formatted(LocalDate.now().plusDays(10), deadline);
    }

    private static final String QUOTE_JSON = """
            {"pricePerUnit":17.5,"quantity":500,"notes":"Ex-farm price"}""";

    private String createRfq() throws Exception {
        String body = mvc.perform(post("/api/rfqs").header("Authorization", bearer("u-buyer"))
                        .contentType(MediaType.APPLICATION_JSON).content(rfqJson(LocalDate.now().plusDays(5))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    @Test
    void theFullQuoteWorkflowThroughHttp() throws Exception {
        // buyer asks
        mvc.perform(post("/api/rfqs").header("Authorization", bearer("u-buyer"))
                        .contentType(MediaType.APPLICATION_JSON).content(rfqJson(LocalDate.now().plusDays(5))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.sellerName").value("farmer"))
                .andExpect(jsonPath("$.buyerName").value("buyer"))
                .andExpect(jsonPath("$.productName").value("Tomato"))
                .andExpect(jsonPath("$.deadline").value(LocalDate.now().plusDays(5).toString()));
        String id = "rfq-1";

        // the seller sees it in the list and in the inbox
        mvc.perform(get("/api/rfqs").header("Authorization", bearer("u-farmer")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/notifications/me/unread-count").header("Authorization", bearer("u-farmer")))
                .andExpect(jsonPath("$.count").value(1));

        // seller quotes, buyer is told
        mvc.perform(post("/api/rfqs/" + id + "/quote").header("Authorization", bearer("u-farmer"))
                        .contentType(MediaType.APPLICATION_JSON).content(QUOTE_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUOTED"))
                .andExpect(jsonPath("$.quote.pricePerUnit").value(17.5));
        mvc.perform(get("/api/notifications/me/unread-count").header("Authorization", bearer("u-buyer")))
                .andExpect(jsonPath("$.count").value(1));

        // buyer accepts
        mvc.perform(post("/api/rfqs/" + id + "/accept").header("Authorization", bearer("u-buyer")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACCEPTED"));

        // ordering needs Razorpay, which is not configured in this test: 503, and the RFQ stays ACCEPTED without an order
        mvc.perform(post("/api/rfqs/" + id + "/order").header("Authorization", bearer("u-buyer")))
                .andExpect(status().isServiceUnavailable());
        mvc.perform(get("/api/rfqs/" + id).header("Authorization", bearer("u-buyer")))
                .andExpect(jsonPath("$.status").value("ACCEPTED")).andExpect(jsonPath("$.orderId").doesNotExist());
    }

    @Test
    void sellersAndOtherRolesCannotCreateRfqsAndTheRulesAreEnforced() throws Exception {
        mvc.perform(post("/api/rfqs").header("Authorization", bearer("u-farmer"))
                        .contentType(MediaType.APPLICATION_JSON).content(rfqJson(LocalDate.now().plusDays(5))))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/rfqs").contentType(MediaType.APPLICATION_JSON).content(rfqJson(LocalDate.now().plusDays(5))))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/rfqs").header("Authorization", bearer("u-buyer"))
                        .contentType(MediaType.APPLICATION_JSON).content(rfqJson(LocalDate.now().minusDays(1))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/rfqs").header("Authorization", bearer("u-buyer"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"productId\":\"p1\",\"quantity\":0}"))
                .andExpect(status().isBadRequest());
        assertThat(rfqs).isEmpty();
    }

    @Test
    void onlyTheRightPartyCanActOnAnRfq() throws Exception {
        String id = createRfq();

        // the buyer cannot quote; another farmer is not the seller; a stranger cannot even look
        mvc.perform(post("/api/rfqs/" + id + "/quote").header("Authorization", bearer("u-buyer"))
                        .contentType(MediaType.APPLICATION_JSON).content(QUOTE_JSON)).andExpect(status().isForbidden());
        mvc.perform(post("/api/rfqs/" + id + "/quote").header("Authorization", bearer("u-farmer2"))
                        .contentType(MediaType.APPLICATION_JSON).content(QUOTE_JSON)).andExpect(status().isForbidden());
        mvc.perform(get("/api/rfqs/" + id).header("Authorization", bearer("u-buyer2"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/rfqs").header("Authorization", bearer("u-buyer2")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));

        // nothing to accept before there is a quote; the seller cannot accept their own quote
        mvc.perform(post("/api/rfqs/" + id + "/accept").header("Authorization", bearer("u-buyer"))).andExpect(status().isConflict());
        mvc.perform(post("/api/rfqs/" + id + "/quote").header("Authorization", bearer("u-farmer"))
                .contentType(MediaType.APPLICATION_JSON).content(QUOTE_JSON)).andExpect(status().isOk());
        mvc.perform(post("/api/rfqs/" + id + "/accept").header("Authorization", bearer("u-farmer"))).andExpect(status().isForbidden());

        // admins can see everything
        mvc.perform(get("/api/rfqs/" + id).header("Authorization", bearer("u-admin"))).andExpect(status().isOk());
        mvc.perform(get("/api/rfqs/missing").header("Authorization", bearer("u-buyer"))).andExpect(status().isNotFound());
    }

    @Test
    void theBuyerCanRejectOrCancel() throws Exception {
        String rejected = createRfq();
        mvc.perform(post("/api/rfqs/" + rejected + "/quote").header("Authorization", bearer("u-farmer"))
                .contentType(MediaType.APPLICATION_JSON).content(QUOTE_JSON)).andExpect(status().isOk());
        mvc.perform(post("/api/rfqs/" + rejected + "/reject").header("Authorization", bearer("u-buyer")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REJECTED"));

        String cancelled = createRfq();
        mvc.perform(post("/api/rfqs/" + cancelled + "/cancel").header("Authorization", bearer("u-buyer")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void theInboxListsMarksReadAndKeepsMessagesPrivate() throws Exception {
        createRfq();

        String body = mvc.perform(get("/api/notifications/me").header("Authorization", bearer("u-farmer")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].read").value(false))
                .andExpect(jsonPath("$[0].subject").value("New quote request"))
                .andReturn().getResponse().getContentAsString();
        String notificationId = JsonPath.read(body, "$[0].id");

        // somebody else's inbox is empty and cannot touch it
        mvc.perform(get("/api/notifications/me").header("Authorization", bearer("u-buyer")))
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(post("/api/notifications/" + notificationId + "/read").header("Authorization", bearer("u-buyer")))
                .andExpect(status().isNotFound());

        mvc.perform(post("/api/notifications/" + notificationId + "/read").header("Authorization", bearer("u-farmer")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.read").value(true));
        mvc.perform(get("/api/notifications/me/unread-count").header("Authorization", bearer("u-farmer")))
                .andExpect(jsonPath("$.count").value(0));

        mvc.perform(get("/api/notifications/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void markAllReadClearsTheBadge() throws Exception {
        String id = createRfq();
        mvc.perform(post("/api/rfqs/" + id + "/cancel").header("Authorization", bearer("u-buyer"))).andExpect(status().isOk());
        mvc.perform(get("/api/notifications/me/unread-count").header("Authorization", bearer("u-farmer")))
                .andExpect(jsonPath("$.count").value(2));

        mvc.perform(post("/api/notifications/read-all").header("Authorization", bearer("u-farmer")))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/notifications/me/unread-count").header("Authorization", bearer("u-farmer")))
                .andExpect(jsonPath("$.count").value(0));
    }

    @Test
    void sellersListOrdersForTheirProductsWithoutOtherSellersLinesOrTheBuyerId() throws Exception {
        orders.add(Order.builder().id("order-1").buyerId("u-buyer").status(OrderStatus.PAID).amount(70.0)
                .items(List.of(new OrderItem("p1", "Tomato", 2, 10.0, "u-farmer"),
                        new OrderItem("p2", "Onion", 5, 10.0, "u-farmer2"))).build());

        mvc.perform(get("/api/orders/seller").header("Authorization", bearer("u-farmer")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].orderId").value("order-1"))
                .andExpect(jsonPath("$[0].buyerName").value("buyer"))
                .andExpect(jsonPath("$[0].buyerId").doesNotExist())
                .andExpect(jsonPath("$[0].items.length()").value(1))
                .andExpect(jsonPath("$[0].items[0].productName").value("Tomato"))
                .andExpect(jsonPath("$[0].subtotal").value(20.0));

        mvc.perform(get("/api/orders/seller").header("Authorization", bearer("u-buyer"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/orders/seller")).andExpect(status().isUnauthorized());
    }
}
