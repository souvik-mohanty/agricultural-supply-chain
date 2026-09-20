package com.agrolink;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.data.mongodb.auto-index-creation=false",
        "management.health.mongo.enabled=false",
        "app.maintenance.enabled=true"
})
@AutoConfigureMockMvc
class MaintenanceModeTest {

    @Autowired MockMvc mvc;

    @Test
    void everyRequestGets503WhileInMaintenance() throws Exception {
        mvc.perform(get("/api/products"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("Service temporarily unavailable due to maintenance."));
    }

    @Test
    void theHealthCheckStaysReachable() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
