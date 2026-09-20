package com.agrolink.warehouse;

import com.agrolink.warehouse.dto.WarehouseRequest;
import com.agrolink.warehouse.dto.WarehouseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warehouse")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('WAREHOUSE_OPERATOR', 'MANAGER', 'ADMIN')")
public class WarehouseController {

    private final WarehouseService service;

    @PostMapping("/store")
    public WarehouseResponse storeCrop(@Valid @RequestBody WarehouseRequest request) {
        return service.storeCrop(request);
    }

    @GetMapping("/location/{location}")
    public List<WarehouseResponse> getByLocation(@PathVariable String location) {
        return service.getByLocation(location);
    }

    @PutMapping("/mark-ready/{id}")
    public WarehouseResponse markReadyForDelivery(@PathVariable String id) {
        return service.markReadyForDelivery(id);
    }

    @GetMapping("/ready")
    public List<WarehouseResponse> getReadyForDelivery() {
        return service.getReadyForDelivery();
    }
}
