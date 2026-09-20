package com.agrolink.advisory;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface AdvisoryRepository extends MongoRepository<AdvisoryContent, String> {
}
