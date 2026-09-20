package com.agrolink.rfq.dto;

import com.agrolink.rfq.Quote;
import com.agrolink.rfq.Rfq;
import com.agrolink.rfq.RfqStatus;

import java.time.Instant;
import java.time.LocalDate;

public record RfqResponse(
        String id,
        String productId,
        String productName,
        String buyerId,
        String buyerName,
        String sellerId,
        String sellerName,
        int quantity,
        String unit,
        Double targetPricePerUnit,
        String deliveryLocation,
        LocalDate requiredDeliveryDate,
        String requirements,
        LocalDate deadline,
        RfqStatus status,
        Quote quote,
        String orderId,
        Instant createdAt,
        Instant updatedAt) {

    public static RfqResponse from(Rfq rfq) {
        return new RfqResponse(rfq.getId(), rfq.getProductId(), rfq.getProductName(), rfq.getBuyerId(), rfq.getBuyerName(),
                rfq.getSellerId(), rfq.getSellerName(), rfq.getQuantity(), rfq.getUnit(), rfq.getTargetPricePerUnit(),
                rfq.getDeliveryLocation(), rfq.getRequiredDeliveryDate(), rfq.getRequirements(), rfq.getDeadline(),
                rfq.getStatus(), rfq.getQuote(), rfq.getOrderId(), rfq.getCreatedAt(), rfq.getUpdatedAt());
    }
}
