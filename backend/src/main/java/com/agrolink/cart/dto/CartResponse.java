package com.agrolink.cart.dto;

import com.agrolink.cart.Cart;
import com.agrolink.cart.CartItem;

import java.util.List;

public record CartResponse(String id, String userId, List<CartItem> items, double total) {

    public static CartResponse from(Cart cart) {
        return new CartResponse(cart.getId(), cart.getUserId(), cart.getItems(), cart.getTotal());
    }

    public static CartResponse empty(String userId) {
        return new CartResponse(null, userId, List.of(), 0.0);
    }
}
