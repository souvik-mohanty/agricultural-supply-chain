package com.agrolink;

import com.agrolink.user.User;
import com.agrolink.user.UserRepository;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DemoLoginTest {

    /** Backed by a tiny in-memory "collection" so a demo user created on login can be found again by the JWT filter. */
    abstract static class Base {
        @Autowired MockMvc mvc;
        @MockitoBean UserRepository userRepository;
        final Map<String, User> users = new HashMap<>();

        @BeforeEach
        void fakeUserCollection() {
            when(userRepository.findByUsername(anyString()))
                    .thenAnswer(invocation -> Optional.ofNullable(users.get(invocation.<String>getArgument(0))));
            when(userRepository.findById(anyString())).thenAnswer(invocation -> users.values().stream()
                    .filter(user -> user.getId().equals(invocation.<String>getArgument(0))).findFirst());
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                if (user.getId() == null) {
                    user.setId("id-" + user.getUsername());
                }
                users.put(user.getUsername(), user);
                return user;
            });
        }
    }

    @Nested
    @SpringBootTest(properties = "spring.data.mongodb.auto-index-creation=false")
    @AutoConfigureMockMvc
    class DisabledByDefault extends Base {

        @Test
        void noRolesAreOfferedAndLoginIs404() throws Exception {
            mvc.perform(get("/api/auth/demo-login"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
            mvc.perform(post("/api/auth/demo-login/ADMIN"))
                    .andExpect(status().isNotFound());
            assertThat(users).isEmpty();
        }
    }

    @Nested
    @SpringBootTest(properties = {"spring.data.mongodb.auto-index-creation=false", "app.demo-login.enabled=true"})
    @AutoConfigureMockMvc
    class Enabled extends Base {

        @Test
        void everyRoleIsOffered() throws Exception {
            mvc.perform(get("/api/auth/demo-login"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value(org.hamcrest.Matchers.hasItems("ADMIN", "FARMER", "BUYER", "ADVISOR")));
        }

        @Test
        void loggingInAsAdminNeedsNoPasswordAndTheTokenReallyIsAdmin() throws Exception {
            String body = mvc.perform(post("/api/auth/demo-login/admin"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value("ADMIN"))
                    .andReturn().getResponse().getContentAsString();
            String token = com.jayway.jsonpath.JsonPath.read(body, "$.token");

            mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());
        }

        @Test
        void aFarmerTokenStaysAFarmer() throws Exception {
            String body = mvc.perform(post("/api/auth/demo-login/FARMER")).andReturn().getResponse().getContentAsString();
            String token = com.jayway.jsonpath.JsonPath.read(body, "$.token");

            mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.username").value("demo-farmer"));
            mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }

        @Test
        void demoAccountsCannotBeEnteredThroughTheNormalLoginForm() throws Exception {
            mvc.perform(post("/api/auth/demo-login/BUYER")).andExpect(status().isOk());

            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"demo-buyer\",\"password\":\"demo-buyer\"}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void unknownRolesAreRejected() throws Exception {
            mvc.perform(post("/api/auth/demo-login/SUPERUSER")).andExpect(status().isBadRequest());
        }
    }
}
