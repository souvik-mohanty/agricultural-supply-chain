package com.agrolink.cart;

import com.agrolink.cart.dto.CartResponse;
import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ConflictException;
import com.agrolink.common.exception.ResourceNotFoundException;
import com.agrolink.product.ProductService;
import com.agrolink.product.dto.ProductResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    private static final String USER = "user-1";

    @Mock CartRepository cartRepository;
    @Mock ProductService productService;

    CartService cartService;

    @BeforeEach
    void setUp() {
        cartService = new CartService(cartRepository, productService);
    }

    private static ProductResponse product(String id, double price, int stock) {
        return new ProductResponse(id, "farmer-1", "Tomato", "VEGETABLE", price, stock, List.of(), null, null);
    }

    private void givenCartSaveReturnsArgument() {
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void addingAnItemCreatesTheCartAndComputesTheTotal() {
        when(productService.getProduct("p1")).thenReturn(product("p1", 25.0, 10));
        when(cartRepository.findByUserId(USER)).thenReturn(Optional.empty());
        givenCartSaveReturnsArgument();

        CartResponse cart = cartService.addItem(USER, "p1", 3);

        assertThat(cart.userId()).isEqualTo(USER);
        assertThat(cart.items()).hasSize(1);
        assertThat(cart.items().get(0).getQuantity()).isEqualTo(3);
        assertThat(cart.total()).isEqualTo(75.0);
    }

    @Test
    void addingTheSameProductAgainIncreasesTheQuantity() {
        Cart existing = Cart.builder().userId(USER)
                .items(new ArrayList<>(List.of(new CartItem("p1", 2, 25.0)))).total(50.0).build();
        when(productService.getProduct("p1")).thenReturn(product("p1", 25.0, 10));
        when(cartRepository.findByUserId(USER)).thenReturn(Optional.of(existing));
        givenCartSaveReturnsArgument();

        CartResponse cart = cartService.addItem(USER, "p1", 3);

        assertThat(cart.items()).hasSize(1);
        assertThat(cart.items().get(0).getQuantity()).isEqualTo(5);
        assertThat(cart.total()).isEqualTo(125.0);
    }

    @Test
    void cannotAddMoreThanIsInStockIncludingWhatIsAlreadyInTheCart() {
        Cart existing = Cart.builder().userId(USER)
                .items(new ArrayList<>(List.of(new CartItem("p1", 8, 25.0)))).build();
        when(productService.getProduct("p1")).thenReturn(product("p1", 25.0, 10));
        when(cartRepository.findByUserId(USER)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> cartService.addItem(USER, "p1", 3)).isInstanceOf(ConflictException.class);
        verify(cartRepository, never()).save(any());
    }

    @Test
    void rejectsNonPositiveQuantities() {
        assertThatThrownBy(() -> cartService.addItem(USER, "p1", 0)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void removingSomeUnitsKeepsTheLine() {
        Cart existing = Cart.builder().userId(USER)
                .items(new ArrayList<>(List.of(new CartItem("p1", 5, 10.0)))).build();
        when(cartRepository.findByUserId(USER)).thenReturn(Optional.of(existing));
        givenCartSaveReturnsArgument();

        CartResponse cart = cartService.removeItem(USER, "p1", 2);

        assertThat(cart.items().get(0).getQuantity()).isEqualTo(3);
        assertThat(cart.total()).isEqualTo(30.0);
    }

    @Test
    void removingWithoutQuantityOrAllUnitsDropsTheLine() {
        Cart existing = Cart.builder().userId(USER)
                .items(new ArrayList<>(List.of(new CartItem("p1", 5, 10.0), new CartItem("p2", 1, 4.0)))).build();
        when(cartRepository.findByUserId(USER)).thenReturn(Optional.of(existing));
        givenCartSaveReturnsArgument();

        assertThat(cartService.removeItem(USER, "p1", null).items()).extracting(CartItem::getProductId).containsExactly("p2");
        assertThat(cartService.removeItem(USER, "p2", 1).items()).isEmpty();
    }

    @Test
    void removingFromAMissingCartOrLineIsNotFound() {
        when(cartRepository.findByUserId(USER)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> cartService.removeItem(USER, "p1", null)).isInstanceOf(ResourceNotFoundException.class);

        when(cartRepository.findByUserId(USER)).thenReturn(Optional.of(Cart.builder().userId(USER).build()));
        assertThatThrownBy(() -> cartService.removeItem(USER, "p1", null)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void anEmptyCartIsReturnedWhenTheUserHasNone() {
        when(cartRepository.findByUserId(USER)).thenReturn(Optional.empty());

        CartResponse cart = cartService.getCart(USER);

        assertThat(cart.items()).isEmpty();
        assertThat(cart.total()).isZero();
    }
}
