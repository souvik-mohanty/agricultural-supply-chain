package com.agrolink.rfq;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RfqRepository extends MongoRepository<Rfq, String> {
    List<Rfq> findByBuyerIdOrSellerIdOrderByCreatedAtDesc(String buyerId, String sellerId);

    List<Rfq> findAllByOrderByCreatedAtDesc();
}
