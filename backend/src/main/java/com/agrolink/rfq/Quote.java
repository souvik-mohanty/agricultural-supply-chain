package com.agrolink.rfq;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

/** The seller's answer to an RFQ. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Quote {
    private double pricePerUnit;
    private int quantity;
    private LocalDate deliveryDate;
    private String notes;
    private Instant quotedAt;
}
