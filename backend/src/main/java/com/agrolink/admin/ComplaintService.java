package com.agrolink.admin;

import com.agrolink.admin.dto.ComplaintRequest;
import com.agrolink.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository repository;

    public Complaint file(String raisedBy, ComplaintRequest request) {
        return repository.save(Complaint.builder()
                .raisedBy(raisedBy)
                .against(request.against())
                .message(request.message())
                .build());
    }

    public List<Complaint> getAll() {
        return repository.findAll();
    }

    public void resolve(String id) {
        Complaint complaint = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
        complaint.setResolved(true);
        repository.save(complaint);
    }
}
