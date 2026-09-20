package com.agrolink.rfq.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record SubmitQuoteRequest(
        @Positive double pricePerUnit,
        @Positive int quantity,
        LocalDate deliveryDate,
        @Size(max = 1000) String notes) {
}
