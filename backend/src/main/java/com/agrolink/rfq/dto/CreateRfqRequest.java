package com.agrolink.rfq.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Dates are ISO strings such as {@code 2026-10-31}. {@code unit} defaults to "kg" when blank. */
public record CreateRfqRequest(
        @NotBlank String productId,
        @Positive int quantity,
        @Size(max = 20) String unit,
        @Positive Double targetPricePerUnit,
        @NotBlank @Size(max = 200) String deliveryLocation,
        LocalDate requiredDeliveryDate,
        @Size(max = 1000) String requirements,
        @NotNull LocalDate deadline) {
}
