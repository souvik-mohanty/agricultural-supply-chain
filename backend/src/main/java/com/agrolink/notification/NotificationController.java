package com.agrolink.notification;

import com.agrolink.notification.dto.NotificationRequest;
import com.agrolink.notification.dto.NotificationResponse;
import com.agrolink.notification.dto.UnreadCountResponse;
import com.agrolink.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    /** The caller's inbox, newest first (last 50). */
    @GetMapping("/me")
    public List<NotificationResponse> inbox(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.inbox(principal.getId()).stream().map(NotificationResponse::from).toList();
    }

    @GetMapping("/me/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return new UnreadCountResponse(notificationService.unreadCount(principal.getId()));
    }

    @PostMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable String id, @AuthenticationPrincipal UserPrincipal principal) {
        return NotificationResponse.from(notificationService.markRead(id, principal.getId()));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
