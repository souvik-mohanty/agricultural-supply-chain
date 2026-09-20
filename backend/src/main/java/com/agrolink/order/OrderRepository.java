package com.agrolink.order;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByBuyerIdOrderByCreatedAtDesc(String buyerId);

    List<Order> findByItemsSellerIdOrderByCreatedAtDesc(String sellerId);

    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, Instant cutoff);
}
