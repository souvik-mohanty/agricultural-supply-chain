package com.agrolink.order;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A product line of an order, priced at the moment the order was placed. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    private String productId;
    private String productName;
    private int quantity;
    private double unitPrice;

    /** The farmer who owns the product; lets sellers list the orders that contain their products. */
    private String sellerId;
}
