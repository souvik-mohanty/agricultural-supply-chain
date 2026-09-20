package com.agrolink.cart;

import com.agrolink.cart.dto.CartResponse;
import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ConflictException;
import com.agrolink.common.exception.ResourceNotFoundException;
import com.agrolink.product.ProductService;
import com.agrolink.product.dto.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductService productService;

    public CartResponse getCart(String userId) {
        return cartRepository.findByUserId(userId)
                .map(CartResponse::from)
                .orElseGet(() -> CartResponse.empty(userId));
    }

    public CartResponse addItem(String userId, String productId, int quantity) {
        if (quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than 0");
        }
        ProductResponse product = productService.getProduct(productId);
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> Cart.builder().userId(userId).build());

        Optional<CartItem> existing = findItem(cart, productId);
        int totalQuantity = existing.map(CartItem::getQuantity).orElse(0) + quantity;
        if (totalQuantity > product.quantityAvailable()) {
            throw new ConflictException(String.format(
                    "Insufficient stock for product %s. Requested total: %d, available: %d",
                    productId, totalQuantity, product.quantityAvailable()));
        }

        if (existing.isPresent()) {
            existing.get().setQuantity(totalQuantity);
        } else {
            cart.getItems().add(CartItem.builder()
                    .productId(productId)
                    .quantity(quantity)
                    .priceAtAddTime(product.pricePerUnit())
                    .build());
        }
        return save(cart);
    }

    /**
     * Removes {@code quantity} units of a product, or the whole line when {@code quantity} is null or covers all of it.
     */
    public CartResponse removeItem(String userId, String productId, Integer quantity) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + userId));
        CartItem item = findItem(cart, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product " + productId + " is not in the cart"));

        if (quantity != null && quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than 0");
        }
        if (quantity == null || quantity >= item.getQuantity()) {
            cart.getItems().remove(item);
        } else {
            item.setQuantity(item.getQuantity() - quantity);
        }
        return save(cart);
    }

    /** Drops whole lines from the cart, e.g. after those products were bought. Does nothing when there is no cart. */
    public void removeProducts(String userId, Collection<String> productIds) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            if (cart.getItems().removeIf(item -> productIds.contains(item.getProductId()))) {
                save(cart);
            }
        });
    }

    private CartResponse save(Cart cart) {
        cart.setTotal(cart.getItems().stream()
                .mapToDouble(item -> item.getPriceAtAddTime() * item.getQuantity())
                .sum());
        return CartResponse.from(cartRepository.save(cart));
    }

    private Optional<CartItem> findItem(Cart cart, String productId) {
        return cart.getItems().stream().filter(item -> item.getProductId().equals(productId)).findFirst();
    }
}
