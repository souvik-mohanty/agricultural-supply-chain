package com.agrolink.order;

import com.agrolink.order.dto.CreateOrderRequest;
import com.agrolink.order.dto.OrderResponse;
import com.agrolink.order.dto.PaymentResponse;
import com.agrolink.order.dto.VerifyPaymentRequest;
import com.agrolink.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** Places an order for the given products ("buy now"). Returns what the browser needs to open Razorpay Checkout. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse createOrder(@Valid @RequestBody CreateOrderRequest request,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        return orderService.createOrder(principal.getId(), request.items());
    }

    /** Places an order for everything in the current user's cart. */
    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse checkout(@AuthenticationPrincipal UserPrincipal principal) {
        return orderService.checkoutCart(principal.getId());
    }

    @PostMapping("/{id}/verify")
    public OrderResponse verifyPayment(@PathVariable String id,
                                       @Valid @RequestBody VerifyPaymentRequest request,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        return orderService.verifyPayment(id, principal, request);
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancel(@PathVariable String id, @AuthenticationPrincipal UserPrincipal principal) {
        return orderService.cancel(id, principal);
    }

    @GetMapping
    public List<OrderResponse> myOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return orderService.getMyOrders(principal.getId());
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(@PathVariable String id, @AuthenticationPrincipal UserPrincipal principal) {
        return orderService.getOrder(id, principal);
    }
}
