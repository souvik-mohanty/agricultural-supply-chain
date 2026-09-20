package com.agrolink.common.maintenance;

import com.agrolink.common.exception.ApiErrorWriter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Kill switch that answers 503 while the application is in maintenance.
 * Registered inside the security filter chain (see SecurityConfig) so CORS headers are still added to the 503.
 */
public class MaintenanceFilter extends OncePerRequestFilter {

    private static final String HEALTH_PATH = "/actuator/health";

    private final MaintenanceProperties properties;
    private final ApiErrorWriter errorWriter;

    public MaintenanceFilter(MaintenanceProperties properties, ApiErrorWriter errorWriter) {
        this.properties = properties;
        this.errorWriter = errorWriter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getRequestURI().startsWith(HEALTH_PATH);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (isBlocked(request)) {
            errorWriter.write(request, response, HttpStatus.SERVICE_UNAVAILABLE,
                    "Service temporarily unavailable due to maintenance.");
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean isBlocked(HttpServletRequest request) {
        if (properties.enabled()) {
            return true;
        }
        String uri = request.getRequestURI();
        if (properties.blockedPaths().stream().anyMatch(uri::startsWith)) {
            return true;
        }
        String origin = request.getHeader("Origin");
        return StringUtils.hasText(properties.blockedOrigin()) && properties.blockedOrigin().equals(origin);
    }
}
