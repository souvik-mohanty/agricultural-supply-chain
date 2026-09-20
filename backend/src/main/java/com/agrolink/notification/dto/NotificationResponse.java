package com.agrolink.notification.dto;

import com.agrolink.notification.Notification;

import java.time.LocalDateTime;

/** An inbox entry as the user sees it. */
public record NotificationResponse(String id, String subject, String message, boolean read, LocalDateTime timestamp) {

    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getSubject(), notification.getMessage(),
                notification.isRead(), notification.getTimestamp());
    }
}
