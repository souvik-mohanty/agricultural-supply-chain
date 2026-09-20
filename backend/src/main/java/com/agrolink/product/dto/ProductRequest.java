package com.agrolink.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/** Bound from multipart form fields. {@code farmerId} is only read when an admin creates a product on a farmer's behalf. */
@Data
public class ProductRequest {
    private String farmerId;

    @NotBlank(message = "Product name cannot be empty")
    private String name;

    @NotBlank(message = "Category cannot be empty")
    private String category;

    @NotNull(message = "Price cannot be null")
    @Positive(message = "Price must be positive")
    private Double pricePerUnit;

    @NotNull(message = "Quantity cannot be null")
    @Positive(message = "Quantity must be a positive number")
    private Integer quantityAvailable;

    private String qualityTag;
    private String cropInfo;
}
