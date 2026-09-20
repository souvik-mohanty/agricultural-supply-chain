package com.agrolink.user.dto;

import jakarta.validation.constraints.NotBlank;

public record RoleChangeRequest(@NotBlank String role) {
}
