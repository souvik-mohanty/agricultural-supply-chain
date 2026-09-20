package com.agrolink.notification;

import com.agrolink.notification.dto.NotificationRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Staff only: this endpoint can send an email to any address. */
    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public String send(@Valid @RequestBody NotificationRequest request) {
        return notificationService.send(request);
    }
}
