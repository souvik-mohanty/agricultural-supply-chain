package com.agrolink;

import com.agrolink.product.Product;
import com.agrolink.product.ProductRepository;
import com.agrolink.security.JwtUtil;
import com.agrolink.user.User;
import com.agrolink.user.UserRepository;
import com.agrolink.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Boots the whole monolith (real filter chain, controllers, exception handler) with the two repositories the tests
 * touch mocked, so no MongoDB is needed.
 */
@SpringBootTest(properties = "spring.data.mongodb.auto-index-creation=false")
@AutoConfigureMockMvc
class SecurityIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtUtil jwtUtil;

    @MockitoBean UserRepository userRepository;
    @MockitoBean ProductRepository productRepository;

    User farmer;
    User admin;

    @BeforeEach
    void setUp() {
        farmer = user("u-farmer", "farmer", UserRole.FARMER);
        admin = user("u-admin", "root", UserRole.ADMIN);
        for (User user : List.of(farmer, admin)) {
            when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
            when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        }
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private User user(String id, String username, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword(passwordEncoder.encode("secret1"));
        user.setRole(role);
        return user;
    }

    private String bearer(User user) {
        return "Bearer " + jwtUtil.generateToken(user.getUsername(), user.getRole().name());
    }

    private static final String LOGIN_JSON = """
            {"username":"%s","password":"%s"}""";

    @Test
    void browsingProductsIsPublic() throws Exception {
        when(productRepository.findAll()).thenReturn(List.of(Product.builder().id("p1").name("Tomato").build()));

        mvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Tomato"));
    }

    @Test
    void protectedEndpointsAnswer401WithAJsonBodyWhenNoTokenIsSent() throws Exception {
        mvc.perform(get("/api/cart"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void aGarbageTokenIsTreatedAsNotLoggedIn() throws Exception {
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginReturnsATokenThatOpensTheProfileEndpoint() throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_JSON.formatted("farmer", "secret1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.role").value("FARMER"))
                .andReturn().getResponse().getContentAsString();
        String token = com.jayway.jsonpath.JsonPath.read(body, "$.token");

        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("farmer"))
                .andExpect(jsonPath("$.id").value("u-farmer"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void wrongPasswordIs401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_JSON.formatted("farmer", "wrong")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void suspendedUsersCannotLogInOrUseAnExistingToken() throws Exception {
        String token = bearer(farmer);
        farmer.setSuspended(true);

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_JSON.formatted("farmer", "secret1")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/users/me").header("Authorization", token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicRegistrationCannotCreateAdmins() throws Exception {
        String json = """
                {"username":"mallory","password":"secret1","email":"m@example.com","role":"ADMIN"}""";

        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isForbidden());
        verify(userRepository, never()).save(any());
    }

    @Test
    void publicRegistrationWorksForOrdinaryRoles() throws Exception {
        String json = """
                {"username":"newbie","password":"secret1","email":"n@example.com","role":"farmer"}""";

        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registrationIsValidated() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void bulkRegistrationIsAdminOnly() throws Exception {
        mvc.perform(post("/api/auth/registers").contentType(MediaType.APPLICATION_JSON).content("[]"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/registers").header("Authorization", bearer(farmer))
                        .contentType(MediaType.APPLICATION_JSON).content("[]"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/registers").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("[]"))
                .andExpect(status().isOk());
    }

    @Test
    void adminEndpointsRequireTheAdminRole() throws Exception {
        when(userRepository.findAll()).thenReturn(List.of(farmer, admin));

        mvc.perform(get("/api/admin/users").header("Authorization", bearer(farmer)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/users").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test
    void usersCanEditThemselvesButNotOthersAndCannotChangeTheirRole() throws Exception {
        mvc.perform(put("/api/users/u-farmer").header("Authorization", bearer(farmer))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"address\":\"New street 1\"}"))
                .andExpect(status().isOk());

        mvc.perform(put("/api/users/u-admin").header("Authorization", bearer(farmer))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"address\":\"hacked\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/users/u-farmer").header("Authorization", bearer(farmer))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void onlyFarmersAndAdminsCanCreateProductsAndFarmersOwnWhatTheyCreate() throws Exception {
        User buyer = user("u-buyer", "buyer", UserRole.BUYER);
        when(userRepository.findByUsername("buyer")).thenReturn(Optional.of(buyer));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId("new-id");
            return product;
        });

        mvc.perform(multipart("/api/products").header("Authorization", bearer(buyer))
                        .param("name", "Tomato").param("category", "VEGETABLE")
                        .param("pricePerUnit", "20").param("quantityAvailable", "5"))
                .andExpect(status().isForbidden());

        mvc.perform(multipart("/api/products").header("Authorization", bearer(farmer))
                        .param("name", "Tomato").param("category", "VEGETABLE")
                        .param("pricePerUnit", "20").param("quantityAvailable", "5")
                        .param("farmerId", "spoofed"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("new-id"))
                .andExpect(jsonPath("$.farmerId").value("u-farmer"));

        mvc.perform(multipart("/api/products").header("Authorization", bearer(farmer))
                        .param("category", "VEGETABLE").param("pricePerUnit", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownPathsAre404Json() throws Exception {
        mvc.perform(get("/api/does-not-exist").header("Authorization", bearer(farmer)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void missingProductsAre404() throws Exception {
        when(productRepository.findById(anyString())).thenReturn(Optional.empty());

        mvc.perform(get("/api/products/nope"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Product not found with id: nope"));
    }
}
