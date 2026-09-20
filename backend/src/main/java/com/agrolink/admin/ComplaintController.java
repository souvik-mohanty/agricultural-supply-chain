package com.agrolink.admin;

import com.agrolink.admin.dto.ComplaintRequest;
import com.agrolink.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Lets any logged-in user file a complaint; admins review them under /api/admin/complaints. */
@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Complaint file(@Valid @RequestBody ComplaintRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return complaintService.file(principal.getId(), request);
    }
}
