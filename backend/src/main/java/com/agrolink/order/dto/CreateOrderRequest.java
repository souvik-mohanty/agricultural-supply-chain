package com.agrolink.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** Buyer and prices are never taken from the client: the buyer is the logged-in user and prices come from the product catalogue. */
public record CreateOrderRequest(@NotEmpty @Valid List<OrderItemRequest> items) {
}
