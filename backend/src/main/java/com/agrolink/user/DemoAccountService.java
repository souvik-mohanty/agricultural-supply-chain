package com.agrolink.user;

import com.agrolink.user.dto.DemoAccountResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * The dummy accounts the login page shows so visitors can look around without registering. Empty unless demo mode
 * ({@code app.demo-login.enabled}, env DEMO_LOGIN_ENABLED) is on. With {@code app.demo-login.include-staff} off
 * (env DEMO_INCLUDE_STAFF=false, the setting for a public showcase) the ADMIN and MANAGER accounts are left out.
 */
@Service
public class DemoAccountService {

    private final boolean enabled;
    private final boolean includeStaff;

    public DemoAccountService(@Value("${app.demo-login.enabled:false}") boolean enabled,
                              @Value("${app.demo-login.include-staff:true}") boolean includeStaff) {
        this.enabled = enabled;
        this.includeStaff = includeStaff;
    }

    public List<DemoAccountResponse> accounts() {
        return enabled ? DemoAccounts.visible(includeStaff).stream().map(DemoAccountResponse::from).toList() : List.of();
    }
}
