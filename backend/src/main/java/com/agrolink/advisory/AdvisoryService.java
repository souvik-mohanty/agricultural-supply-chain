package com.agrolink.advisory;

import com.agrolink.advisory.dto.AdvisoryContentRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdvisoryService {

    private final AdvisoryRepository repository;

    public AdvisoryContent postContent(AdvisoryContentRequest request, String advisorName) {
        return repository.save(new AdvisoryContent(
                null, advisorName, request.type(), request.title(), request.content(), LocalDate.now().toString()));
    }

    public List<AdvisoryContent> getAllContent() {
        return repository.findAll();
    }
}
