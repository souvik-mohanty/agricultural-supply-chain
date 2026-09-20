package com.agrolink.notification;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findTop50ByUserIdOrderByTimestampDesc(String userId);

    long countByUserIdAndReadFalse(String userId);

    List<Notification> findByUserIdAndReadFalse(String userId);
}
