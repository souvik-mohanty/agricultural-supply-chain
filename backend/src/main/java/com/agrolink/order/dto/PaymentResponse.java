package com.agrolink.order.dto;

/**
 * What the browser needs to open Razorpay Checkout.
 *
 * @param orderId         our order id, used later to verify the payment
 * @param razorpayOrderId Razorpay's order id
 * @param razorpayKeyId   public Razorpay key id
 * @param amount          amount in paise
 */
public record PaymentResponse(String orderId, String razorpayOrderId, String razorpayKeyId, String currency, long amount) {
}
