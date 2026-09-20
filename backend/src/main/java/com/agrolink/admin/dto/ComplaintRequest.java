package com.agrolink.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record ComplaintRequest(@NotBlank String against, @NotBlank String message) {
}
