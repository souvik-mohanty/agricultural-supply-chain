package com.agrolink.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 50) String username,
        @NotBlank @Size(min = 6, max = 100) String password,
        @NotBlank @Email String email,
        String aadhar,
        String contactNumber,
        String address,
        @NotBlank String role,
        boolean twoFactorEnabled) {
}
