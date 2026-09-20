package com.agrolink.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document("photos")
public class Photo {
    @Id
    private String id;

    /** The user who uploaded the photo (the farmer that owns the product). */
    private String uploaderId;

    private String filename;
    private String contentType;
    private long fileSize;

    @CreatedDate
    private Instant uploadDate;

    @LastModifiedDate
    private Instant lastModifiedDate;

    private byte[] imageData;
}
