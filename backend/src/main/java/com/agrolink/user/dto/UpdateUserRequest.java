package com.agrolink.user.dto;

import jakarta.validation.constraints.Email;

/** Every field is optional; blank or missing values leave the stored value untouched. */
public record UpdateUserRequest(
        String username,
        String password,
        @Email String email,
        String aadhar,
        String contactNumber,
        String address,
        String role,
        Boolean twoFactorEnabled) {
}
