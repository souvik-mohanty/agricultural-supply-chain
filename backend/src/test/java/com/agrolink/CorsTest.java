package com.agrolink;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** CORS_ALLOWED_ORIGINS accepts several comma-separated origins (production + a custom domain, for example). */
@SpringBootTest(properties = {
        "spring.data.mongodb.auto-index-creation=false",
        "app.cors.allowed-origins=https://agrolink.vercel.app, https://www.agrolink.example"
})
@AutoConfigureMockMvc
class CorsTest {

    @Autowired MockMvc mvc;

    @Test
    void everyListedOriginIsAllowed() throws Exception {
        for (String origin : new String[]{"https://agrolink.vercel.app", "https://www.agrolink.example"}) {
            mvc.perform(options("/api/products")
                            .header("Origin", origin)
                            .header("Access-Control-Request-Method", "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", origin))
                    .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }
    }

    @Test
    void otherOriginsAreRefused() throws Exception {
        mvc.perform(options("/api/products")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
