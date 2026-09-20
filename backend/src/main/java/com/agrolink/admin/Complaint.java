package com.agrolink.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {
    @Id
    private String id;

    /** Id of the user who filed the complaint. */
    private String raisedBy;

    /** Who or what the complaint is about (a user id, product id or free text). */
    private String against;

    private String message;
    private boolean resolved;

    @CreatedDate
    private Instant createdAt;
}
