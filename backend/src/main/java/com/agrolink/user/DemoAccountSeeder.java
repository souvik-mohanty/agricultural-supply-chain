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
 * <p>
 * With {@code app.demo-login.include-staff} off, the ADMIN and MANAGER demo accounts are not created, and any that
 * exist from an earlier run are deleted, so a public showcase never keeps a stale staff login with a known password.
 */
@Slf4j
@Component
public class DemoAccountSeeder implements ApplicationRunner {

    private final boolean enabled;
    private final boolean includeStaff;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoAccountSeeder(@Value("${app.demo-login.enabled:false}") boolean enabled,
                             @Value("${app.demo-login.include-staff:true}") boolean includeStaff,
                             UserRepository userRepository,
                             PasswordEncoder passwordEncoder) {
        this.enabled = enabled;
        this.includeStaff = includeStaff;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }
        try {
            int created = 0;
            for (DemoAccounts.Account account : DemoAccounts.ALL) {
                if (includeStaff || !account.role().isPrivileged()) {
                    upsert(account);
                    created++;
                } else {
                    userRepository.findByUsername(account.username()).ifPresent(userRepository::delete);
                }
            }
            log.warn("DEMO MODE IS ON: {} accounts with publicly listed passwords{} were created/reset. "
                            + "Never enable demo mode on a deployment with real data.",
                    created, includeStaff ? " (including ADMIN and MANAGER)" : " (staff accounts excluded)");
        } catch (RuntimeException e) {
            log.warn("Could not create the demo accounts: {}", e.getMessage());
        }
    }

    private void upsert(DemoAccounts.Account account) {
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
}
