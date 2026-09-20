package com.agrolink.rfq;

import com.agrolink.order.dto.PaymentResponse;
import com.agrolink.rfq.dto.CreateRfqRequest;
import com.agrolink.rfq.dto.RfqResponse;
import com.agrolink.rfq.dto.SubmitQuoteRequest;
import com.agrolink.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Who may do what to a particular RFQ (buyer or seller of it) is enforced in {@link RfqService}. */
@RestController
@RequestMapping("/api/rfqs")
@RequiredArgsConstructor
public class RfqController {

    private final RfqService rfqService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('BUYER', 'CUSTOMER', 'ADMIN')")
    public RfqResponse create(@Valid @RequestBody CreateRfqRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return rfqService.create(principal, request);
    }

    @GetMapping
    public List<RfqResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return rfqService.list(principal);
    }

    @GetMapping("/{id}")
    public RfqResponse get(@PathVariable String id, @AuthenticationPrincipal UserPrincipal principal) {
        return rfqService.get(id, principal);
    }

    @PostMapping("/{id}/quote")
    @PreAuthorize("hasRole('FARMER')")
    public RfqResponse submitQuote(@PathVariable String id,
                                   @Valid @RequestBody SubmitQuoteRequest request,
                                   @AuthenticationPrincipal UserPrincipal principal) {
        return rfqService.submitQuote(id, principal, request);
    }

    @PostMapping("/{id}/accept")
    public RfqResponse accept(@PathVariable String id, @AuthenticationPrincipal UserPrincipal principal) {
        return rfqService.accept(id, principal);
    }

    @PostMapping("/{id}/reject")
    public RfqResponse reject(@PathVariable String id, @AuthenticationPrincipal UserPrincipal principal) {
        return rfqService.reject(id, principal);
    }

    @PostMapping("/{id}/cancel")
    public RfqResponse cancel(@PathVariable String id, @AuthenticationPrincipal UserPrincipal principal) {
        return rfqService.cancel(id, principal);
    }

    /** Creates the order for an accepted quote at the quoted price; returns what Razorpay Checkout needs. */
    @PostMapping("/{id}/order")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse createOrder(@PathVariable String id, @AuthenticationPrincipal UserPrincipal principal) {
        return rfqService.createOrder(id, principal);
    }
}
