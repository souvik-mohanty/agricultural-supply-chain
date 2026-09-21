package com.agrolink;

import com.agrolink.user.DemoAccountSeeder;
import com.agrolink.user.DemoAccounts;
import com.agrolink.user.User;
import com.agrolink.user.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The demo accounts as a visitor meets them: listed on a public endpoint, and each one really signs in. */
class DemoAccountsHttpTest {

    @Nested
    @SpringBootTest(properties = {"spring.data.mongodb.auto-index-creation=false", "app.demo-login.enabled=true"})
    @AutoConfigureMockMvc
    class Enabled {

        @Autowired MockMvc mvc;
        @Autowired DemoAccountSeeder seeder;
        @MockitoBean UserRepository userRepository;
        final Map<String, User> users = new HashMap<>();

        @BeforeEach
        void inMemoryUsersThenSeed() {
            when(userRepository.findByUsername(anyString()))
                    .thenAnswer(inv -> Optional.ofNullable(users.get(inv.<String>getArgument(0))));
            when(userRepository.findById(anyString())).thenAnswer(inv -> users.values().stream()
                    .filter(u -> u.getId().equals(inv.<String>getArgument(0))).findFirst());
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User user = inv.getArgument(0);
                if (user.getId() == null) user.setId("id-" + user.getUsername());
                users.put(user.getUsername(), user);
                return user;
            });
            seeder.run(null); // what happens at server start
        }

        private String login(String username, String password) throws Exception {
            String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, password)))
                    .andReturn().getResponse().getContentAsString();
            return body;
        }

        @Test
        void theLoginPageCanListAllAccountsWithoutLoggingIn() throws Exception {
            mvc.perform(get("/api/auth/demo-accounts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(DemoAccounts.ALL.size()))
                    .andExpect(jsonPath("$[0].username").value("admin_demo"))
                    .andExpect(jsonPath("$[0].password").value("Admin@123"))
                    .andExpect(jsonPath("$[0].role").value("ADMIN"))
                    .andExpect(jsonPath("$[0].description").isNotEmpty());
        }

        @Test
        void everyListedAccountSignsInThroughTheNormalLoginWithItsOwnRole() throws Exception {
            for (DemoAccounts.Account account : DemoAccounts.ALL) {
                String body = login(account.username(), account.password());
                assertThat((String) JsonPath.read(body, "$.role")).as(account.username()).isEqualTo(account.role().name());
                String token = JsonPath.read(body, "$.token");

                mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.username").value(account.username()))
                        .andExpect(jsonPath("$.password").doesNotExist());
            }
        }

        @Test
        void aWrongPasswordIsStillRefused() throws Exception {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"admin_demo\",\"password\":\"not-the-password\"}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void aSuspendedDemoAccountWorksAgainAfterTheNextStart() throws Exception {
            users.get("buyer_asha").setSuspended(true);
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"buyer_asha\",\"password\":\"Buyer@123\"}"))
                    .andExpect(status().isForbidden());

            seeder.run(null);

            assertThat((String) JsonPath.read(login("buyer_asha", "Buyer@123"), "$.token")).isNotBlank();
        }

        @Test
        void demoAccountsCannotBeUsedToReachAdminEndpointsUnlessTheyAreAdmins() throws Exception {
            String farmerToken = JsonPath.read(login("farmer_ravi", "Farmer@123"), "$.token");
            String adminToken = JsonPath.read(login("admin_demo", "Admin@123"), "$.token");

            mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + farmerToken)).andExpect(status().isForbidden());
            mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken)).andExpect(status().isOk());
        }
    }

    /** How the deployed showcase runs: demo mode on, but no ADMIN/MANAGER account with a public password. */
    @Nested
    @SpringBootTest(properties = {"spring.data.mongodb.auto-index-creation=false", "app.demo-login.enabled=true",
            "app.demo-login.include-staff=false"})
    @AutoConfigureMockMvc
    class PublicShowcaseWithoutStaff {

        @Autowired MockMvc mvc;
        @Autowired DemoAccountSeeder seeder;
        @MockitoBean UserRepository userRepository;
        final Map<String, User> users = new HashMap<>();

        @BeforeEach
        void inMemoryUsersThenSeed() {
            when(userRepository.findByUsername(anyString()))
                    .thenAnswer(inv -> Optional.ofNullable(users.get(inv.<String>getArgument(0))));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User user = inv.getArgument(0);
                if (user.getId() == null) user.setId("id-" + user.getUsername());
                users.put(user.getUsername(), user);
                return user;
            });
            seeder.run(null);
        }

        private int loginStatus(String username, String password) throws Exception {
            return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, password)))
                    .andReturn().getResponse().getStatus();
        }

        @Test
        void onlyTheEightNonStaffAccountsAreListed() throws Exception {
            mvc.perform(get("/api/auth/demo-accounts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(DemoAccounts.ALL.size() - 2))
                    .andExpect(jsonPath("$[?(@.role == 'ADMIN')]").isEmpty())
                    .andExpect(jsonPath("$[?(@.role == 'MANAGER')]").isEmpty());
        }

        @Test
        void theListedAccountsSignInButTheStaffOnesDoNot() throws Exception {
            for (DemoAccounts.Account account : DemoAccounts.visible(false)) {
                assertThat(loginStatus(account.username(), account.password())).as(account.username()).isEqualTo(200);
            }
            assertThat(loginStatus("admin_demo", "Admin@123")).isEqualTo(401);
            assertThat(loginStatus("manager_demo", "Manager@123")).isEqualTo(401);
        }

        @Test
        void thePasswordlessDemoLoginNoLongerExists() throws Exception {
            for (String role : new String[]{"ADMIN", "FARMER"}) {
                int status = mvc.perform(post("/api/auth/demo-login/" + role)).andReturn().getResponse().getStatus();
                assertThat(status).as(role).isIn(401, 403, 404, 405);
            }
        }
    }

    @Nested
    @SpringBootTest(properties = "spring.data.mongodb.auto-index-creation=false")
    @AutoConfigureMockMvc
    class DisabledByDefault {

        @Autowired MockMvc mvc;
        @Autowired DemoAccountSeeder seeder;
        @MockitoBean UserRepository userRepository;

        @Test
        void nothingIsListedOrCreated() throws Exception {
            seeder.run(null);

            mvc.perform(get("/api/auth/demo-accounts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
            verify(userRepository, never()).save(any());
        }
    }
}
