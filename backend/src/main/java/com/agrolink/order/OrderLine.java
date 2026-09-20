package com.agrolink.order;

/** One product line of an order whose unit price is already decided (catalogue price or accepted quote). */
public record OrderLine(String productId, String productName, String sellerId, int quantity, double unitPrice) {
}
