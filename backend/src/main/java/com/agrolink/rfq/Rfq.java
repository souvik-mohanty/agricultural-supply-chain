package com.agrolink.rfq;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

/** A buyer's request for a quote on one product, addressed to the seller who owns that product. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "rfqs")
public class Rfq {

    @Id
    private String id;

    private String productId;
    private String productName;

    @Indexed
    private String buyerId;
    private String buyerName;

    @Indexed
    private String sellerId;
    private String sellerName;

    private int quantity;
    private String unit;
    private Double targetPricePerUnit;
    private String deliveryLocation;
    private LocalDate requiredDeliveryDate;
    private String requirements;

    /** Last day the RFQ can still be answered or accepted. */
    private LocalDate deadline;

    private RfqStatus status;
    private Quote quote;

    /** Set once the buyer has created an order from the accepted quote. */
    private String orderId;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
