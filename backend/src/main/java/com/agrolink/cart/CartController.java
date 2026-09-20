package com.agrolink.cart;

import com.agrolink.cart.dto.CartResponse;
import com.agrolink.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** The cart always belongs to the authenticated user. */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return cartService.getCart(principal.getId());
    }

    @PostMapping("/add")
    public CartResponse addToCart(@AuthenticationPrincipal UserPrincipal principal,
                                  @RequestParam String productId,
                                  @RequestParam int quantity) {
        return cartService.addItem(principal.getId(), productId, quantity);
    }

    @DeleteMapping("/remove")
    public CartResponse removeFromCart(@AuthenticationPrincipal UserPrincipal principal,
                                       @RequestParam String productId,
                                       @RequestParam(required = false) Integer quantity) {
        return cartService.removeItem(principal.getId(), productId, quantity);
    }
}
