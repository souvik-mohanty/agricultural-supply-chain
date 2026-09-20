package com.agrolink.user;

import com.agrolink.common.exception.ResourceNotFoundException;
import com.agrolink.security.JwtUtil;
import com.agrolink.user.dto.JwtResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Passwordless "log in as <role>" for demos and local development. Anyone who can reach the endpoint can become any
 * role, ADMIN included, so it is off unless {@code app.demo-login.enabled} (env DEMO_LOGIN_ENABLED) is true.
 * <p>
 * Each role gets a {@code demo-<role>} account with a random password nobody knows, so the normal login form cannot
 * be used to get into it.
 */
@Slf4j
@Service
public class DemoLoginService {

    private static final String USERNAME_PREFIX = "demo-";

    private final boolean enabled;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public DemoLoginService(@Value("${app.demo-login.enabled:false}") boolean enabled,
                            UserRepository userRepository,
                            PasswordEncoder passwordEncoder,
                            JwtUtil jwtUtil) {
        this.enabled = enabled;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostConstruct
    void warnWhenEnabled() {
        if (enabled) {
            log.warn("DEMO LOGIN IS ENABLED: anyone can sign in as any role, including ADMIN, without a password. "
                    + "Never enable this on a public deployment.");
        }
    }

    /** The roles that can be entered without a password; empty when demo login is off. */
    public List<String> availableRoles() {
        return enabled ? Arrays.stream(UserRole.values()).map(Enum::name).toList() : List.of();
    }

    public JwtResponse login(String roleName) {
        if (!enabled) {
            throw new ResourceNotFoundException("Demo login is not enabled");
        }
        UserRole role = UserService.parseRole(roleName);
        String username = USERNAME_PREFIX + role.name().toLowerCase().replace('_', '-');

        User user = userRepository.findByUsername(username).orElseGet(() -> newDemoUser(username, role));
        if (user.isSuspended()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This demo account has been suspended");
        }
        if (user.getRole() != role) {
            user.setRole(role);
            user = userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getUsername(), role.name());
        return new JwtResponse(token, role.name(), jwtUtil.getExpiration(token).toInstant().toString());
    }

    private User newDemoUser(String username, UserRole role) {
        User user = new User();
        user.setUsername(username);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setEmail(username + "@demo.agrolink.local");
        return userRepository.save(user);
    }
}
