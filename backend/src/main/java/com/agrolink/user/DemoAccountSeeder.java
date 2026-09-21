package com.agrolink.user;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the {@link DemoAccounts} at startup when demo mode ({@code app.demo-login.enabled}, env DEMO_LOGIN_ENABLED)
 * is on. Existing demo users are put back to their listed password, role and active state, so the credentials shown
 * on the login page always work, even if a visitor changed or suspended one of them.
 */
@Slf4j
@Component
public class DemoAccountSeeder implements ApplicationRunner {

    private final boolean enabled;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoAccountSeeder(@Value("${app.demo-login.enabled:false}") boolean enabled,
                             UserRepository userRepository,
                             PasswordEncoder passwordEncoder) {
        this.enabled = enabled;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }
        try {
            for (DemoAccounts.Account account : DemoAccounts.ALL) {
                User user = userRepository.findByUsername(account.username()).orElseGet(User::new);
                user.setUsername(account.username());
                user.setPassword(passwordEncoder.encode(account.password()));
                user.setRole(account.role());
                user.setEmail(account.username() + "@demo.agrolink.local");
                user.setContactNumber(account.contactNumber());
                user.setAddress(account.address());
                user.setSuspended(false);
                userRepository.save(user);
            }
            log.warn("DEMO ACCOUNTS ARE ENABLED: {} accounts with publicly listed passwords (including ADMIN) were "
                    + "created/reset. Never enable demo mode on a deployment with real data.", DemoAccounts.ALL.size());
        } catch (RuntimeException e) {
            log.warn("Could not create the demo accounts: {}", e.getMessage());
        }
    }
}
