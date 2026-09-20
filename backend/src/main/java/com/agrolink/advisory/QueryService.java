package com.agrolink.advisory;

import com.agrolink.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QueryService {

    private final QueryRepository repository;

    public FarmerQuery submitQuery(String question, String farmerName) {
        return repository.save(new FarmerQuery(null, farmerName, question, LocalDate.now().toString(), null, null));
    }

    public FarmerQuery respondToQuery(String id, String response) {
        FarmerQuery query = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Query not found with id: " + id));
        query.setAdvisorResponse(response);
        query.setResponseDate(LocalDate.now().toString());
        return repository.save(query);
    }

    public List<FarmerQuery> getAllQueries() {
        return repository.findAll();
    }

    public List<FarmerQuery> getQueriesOf(String farmerName) {
        return repository.findByFarmerName(farmerName);
    }
}
