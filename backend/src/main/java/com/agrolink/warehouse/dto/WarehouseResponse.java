package com.agrolink.warehouse.dto;

import com.agrolink.warehouse.WarehouseEntry;

import java.time.LocalDateTime;

public record WarehouseResponse(
        String id,
        String cropName,
        String farmerId,
        String warehouseLocation,
        double quantity,
        LocalDateTime entryTime,
        LocalDateTime exitTime,
        boolean readyForDelivery) {

    public static WarehouseResponse from(WarehouseEntry entry) {
        return new WarehouseResponse(
                entry.getId(),
                entry.getCropName(),
                entry.getFarmerId(),
                entry.getWarehouseLocation(),
                entry.getQuantity(),
                entry.getEntryTime(),
                entry.getExitTime(),
                entry.isReadyForDelivery());
    }
}
