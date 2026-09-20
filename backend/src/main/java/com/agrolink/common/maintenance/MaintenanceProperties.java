package com.agrolink.common.maintenance;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

/**
 * @param enabled       block every request (except the health check) with HTTP 503
 * @param blockedPaths  URL prefixes that always return 503
 * @param blockedOrigin requests carrying this {@code Origin} header return 503
 */
@ConfigurationProperties(prefix = "app.maintenance")
public record MaintenanceProperties(
        @DefaultValue("false") boolean enabled,
        @DefaultValue List<String> blockedPaths,
        String blockedOrigin) {
}
