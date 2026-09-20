package com.agrolink.notification.dto;

import jakarta.validation.constraints.NotBlank;

/** {@code type} is one of EMAIL, SMS or PUSH (case-insensitive). */
public record NotificationRequest(
        @NotBlank String recipient,
        @NotBlank String type,
        String subject,
        @NotBlank String message) {
}
