package com.agrolink.order.dto;

import com.agrolink.order.Order;
import com.agrolink.order.OrderItem;
import com.agrolink.order.OrderStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

/** An order as its seller sees it: only the seller's own lines, and no buyer id. */
public record SellerOrderResponse(
        String orderId,
        String buyerName,
        List<OrderItem> items,
        double subtotal,
        OrderStatus status,
        Instant createdAt) {

    public static SellerOrderResponse from(Order order, String sellerId, String buyerName) {
        List<OrderItem> mine = order.getItems().stream().filter(item -> sellerId.equals(item.getSellerId())).toList();
        double subtotal = mine.stream()
                .map(item -> BigDecimal.valueOf(item.getUnitPrice()).multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
        return new SellerOrderResponse(order.getId(), buyerName, mine, subtotal, order.getStatus(), order.getCreatedAt());
    }
}
