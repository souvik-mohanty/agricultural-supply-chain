package com.agrolink.warehouse;

import com.agrolink.common.exception.ResourceNotFoundException;
import com.agrolink.warehouse.dto.WarehouseRequest;
import com.agrolink.warehouse.dto.WarehouseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository repository;

    public WarehouseResponse storeCrop(WarehouseRequest request) {
        WarehouseEntry entry = WarehouseEntry.builder()
                .cropName(request.cropName())
                .farmerId(request.farmerId())
                .warehouseLocation(request.warehouseLocation())
                .quantity(request.quantity())
                .entryTime(LocalDateTime.now())
                .readyForDelivery(false)
                .build();
        return WarehouseResponse.from(repository.save(entry));
    }

    public List<WarehouseResponse> getByLocation(String location) {
        return repository.findByWarehouseLocation(location).stream().map(WarehouseResponse::from).toList();
    }

    public WarehouseResponse markReadyForDelivery(String id) {
        WarehouseEntry entry = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse entry not found with id: " + id));
        entry.setReadyForDelivery(true);
        entry.setExitTime(LocalDateTime.now());
        return WarehouseResponse.from(repository.save(entry));
    }

    public List<WarehouseResponse> getReadyForDelivery() {
        return repository.findByReadyForDeliveryTrue().stream().map(WarehouseResponse::from).toList();
    }
}
