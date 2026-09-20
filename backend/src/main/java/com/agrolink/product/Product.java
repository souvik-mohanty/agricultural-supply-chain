package com.agrolink.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document("products")
public class Product {
    @Id
    private String id;
    private String farmerId;
    private String name;
    private String category;
    private Double pricePerUnit;
    private Integer quantityAvailable;
    private List<String> photoIds;
    private String qualityTag;
    private String cropInfo;
}
