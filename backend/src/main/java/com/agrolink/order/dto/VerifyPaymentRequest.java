package com.agrolink.order.dto;

import jakarta.validation.constraints.NotBlank;

/** The values Razorpay Checkout hands back to the browser after a successful payment. */
public record VerifyPaymentRequest(@NotBlank String razorpayPaymentId, @NotBlank String razorpaySignature) {
}
