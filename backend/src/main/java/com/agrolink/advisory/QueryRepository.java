package com.agrolink.advisory;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface QueryRepository extends MongoRepository<FarmerQuery, String> {
    List<FarmerQuery> findByFarmerName(String farmerName);
}
