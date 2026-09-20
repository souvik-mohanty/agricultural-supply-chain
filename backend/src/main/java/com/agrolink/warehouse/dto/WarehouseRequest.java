package com.agrolink.warehouse.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record WarehouseRequest(
        @NotBlank String cropName,
        @NotBlank String farmerId,
        @NotBlank String warehouseLocation,
        @Positive double quantity) {
}
