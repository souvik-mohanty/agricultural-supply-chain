package com.agrolink.warehouse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "warehouse_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseEntry {
    @Id
    private String id;
    private String cropName;
    private String farmerId;
    private String warehouseLocation;
    private double quantity;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private boolean readyForDelivery;
}
