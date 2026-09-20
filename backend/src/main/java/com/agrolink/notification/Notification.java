package com.agrolink.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    private String id;

    /** Email address, phone number or (for IN_APP) the user id. */
    private String recipient;

    /** EMAIL, SMS, PUSH or IN_APP. */
    private String type;

    private String subject;
    private String message;
    private LocalDateTime timestamp;

    /** Set for IN_APP notifications: the inbox they belong to. */
    @Indexed
    private String userId;

    private boolean read;
}
