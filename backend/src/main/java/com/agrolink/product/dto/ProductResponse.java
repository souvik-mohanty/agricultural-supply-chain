package com.agrolink.product.dto;

import com.agrolink.product.Product;

import java.util.List;

public record ProductResponse(
        String id,
        String farmerId,
        String name,
        String category,
        double pricePerUnit,
        int quantityAvailable,
        List<String> photoIds,
        String qualityTag,
        String cropInfo) {

    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getFarmerId(),
                product.getName(),
                product.getCategory(),
                product.getPricePerUnit() != null ? product.getPricePerUnit() : 0,
                product.getQuantityAvailable() != null ? product.getQuantityAvailable() : 0,
                product.getPhotoIds(),
                product.getQualityTag(),
                product.getCropInfo());
    }
}
