package com.agrolink.advisory;

import com.agrolink.advisory.dto.AdvisoryContentRequest;
import com.agrolink.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/advisory")
@RequiredArgsConstructor
public class AdvisoryController {

    private final AdvisoryService advisoryService;

    @PostMapping("/post")
    @PreAuthorize("hasAnyRole('ADVISOR', 'ADMIN')")
    public AdvisoryContent postContent(@Valid @RequestBody AdvisoryContentRequest request,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        return advisoryService.postContent(request, principal.getUsername());
    }

    /** Public: advisory articles can be read without logging in. */
    @GetMapping("/all")
    public List<AdvisoryContent> getAll() {
        return advisoryService.getAllContent();
    }
}
