package com.agrolink.advisory;

import com.agrolink.advisory.dto.QueryRequest;
import com.agrolink.advisory.dto.QueryResponseRequest;
import com.agrolink.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/query")
@RequiredArgsConstructor
public class QueryController {

    private final QueryService queryService;

    @PostMapping("/submit")
    public FarmerQuery submitQuery(@Valid @RequestBody QueryRequest request,
                                   @AuthenticationPrincipal UserPrincipal principal) {
        return queryService.submitQuery(request.question(), principal.getUsername());
    }

    @PostMapping("/respond/{id}")
    @PreAuthorize("hasAnyRole('ADVISOR', 'ADMIN')")
    public FarmerQuery respondToQuery(@PathVariable String id, @Valid @RequestBody QueryResponseRequest request) {
        return queryService.respondToQuery(id, request.response());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADVISOR', 'ADMIN')")
    public List<FarmerQuery> getAllQueries() {
        return queryService.getAllQueries();
    }

    @GetMapping("/mine")
    public List<FarmerQuery> myQueries(@AuthenticationPrincipal UserPrincipal principal) {
        return queryService.getQueriesOf(principal.getUsername());
    }
}
