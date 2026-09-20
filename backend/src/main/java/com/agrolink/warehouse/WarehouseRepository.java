package com.agrolink.warehouse;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WarehouseRepository extends MongoRepository<WarehouseEntry, String> {
    List<WarehouseEntry> findByWarehouseLocation(String location);

    List<WarehouseEntry> findByReadyForDeliveryTrue();
}
