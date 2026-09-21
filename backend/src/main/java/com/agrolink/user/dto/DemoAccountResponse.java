package com.agrolink.user.dto;

import com.agrolink.user.DemoAccounts;

/** A demo account as listed on the login page. The password is shown on purpose: these are public demo users. */
public record DemoAccountResponse(String username, String password, String role, String description) {

    public static DemoAccountResponse from(DemoAccounts.Account account) {
        return new DemoAccountResponse(account.username(), account.password(), account.role().name(), account.description());
    }
}
