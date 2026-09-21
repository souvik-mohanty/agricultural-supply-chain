package com.agrolink.user.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * @param role optional: the role the user wants to sign in as. When given, sign-in only succeeds if the account really
 *             has that role; when omitted, any account can sign in (API clients, older callers).
 */
public record LoginRequest(@NotBlank String username, @NotBlank String password, String role) {
}
