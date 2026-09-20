package com.agrolink.user;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Creates the first ADMIN account from {@code app.admin.*} (ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_EMAIL),
 * because public registration cannot create admins. Does nothing when the properties are unset or the user exists.
 */
@Slf4j
@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;
    private final String email;

    public AdminAccountInitializer(UserRepository userRepository,
                                   PasswordEncoder passwordEncoder,
                                   @Value("${app.admin.username:}") String username,
                                   @Value("${app.admin.password:}") String password,
                                   @Value("${app.admin.email:}") String email) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
        this.email = email;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) {
            return;
        }
        try {
            if (userRepository.existsByUsername(username)) {
                return;
            }
            User admin = new User();
            admin.setUsername(username);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setEmail(email);
            admin.setRole(UserRole.ADMIN);
            userRepository.save(admin);
            log.info("Created initial admin account '{}'", username);
        } catch (RuntimeException e) {
            log.warn("Could not create the initial admin account: {}", e.getMessage());
        }
    }
}
