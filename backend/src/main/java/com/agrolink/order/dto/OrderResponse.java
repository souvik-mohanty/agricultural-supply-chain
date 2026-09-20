package com.agrolink.order.dto;

import com.agrolink.order.Order;
import com.agrolink.order.OrderItem;
import com.agrolink.order.OrderStatus;

import java.time.Instant;
import java.util.List;

public record OrderResponse(
        String id,
        String buyerId,
        List<OrderItem> items,
        double amount,
        OrderStatus status,
        String razorpayOrderId,
        Instant createdAt,
        Instant updatedAt) {

    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getBuyerId(),
                order.getItems(),
                order.getAmount(),
                order.getStatus(),
                order.getRazorpayOrderId(),
                order.getCreatedAt(),
                order.getUpdatedAt());
    }
}
