package com.agrolink.notification;

import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ResourceNotFoundException;
import com.agrolink.notification.dto.NotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;

    /** Logs the notification and delivers it through the requested channel. */
    public String send(NotificationRequest request) {
        String type = request.type().toUpperCase(Locale.ROOT);
        if (!type.equals("EMAIL") && !type.equals("SMS") && !type.equals("PUSH")) {
            throw new BadRequestException("Unknown notification type: " + request.type());
        }

        notificationRepository.save(Notification.builder()
                .recipient(request.recipient())
                .type(type)
                .subject(request.subject())
                .message(request.message())
                .timestamp(LocalDateTime.now())
                .build());

        return switch (type) {
            case "EMAIL" -> sendEmail(request);
            case "SMS" -> sendSms(request);
            default -> sendPush(request);
        };
    }

    /** Fire-and-forget email for other modules: a failed notification must never break the business operation. */
    public void sendEmailQuietly(String recipient, String subject, String message) {
        try {
            send(new NotificationRequest(recipient, "EMAIL", subject, message));
        } catch (RuntimeException e) {
            log.warn("Could not send notification to {}: {}", recipient, e.getMessage());
        }
    }

    /** Puts a message in the user's in-app inbox. Never throws: a lost notification must not break the caller. */
    public void notifyUser(String userId, String subject, String message) {
        try {
            notificationRepository.save(Notification.builder()
                    .recipient(userId)
                    .userId(userId)
                    .type("IN_APP")
                    .subject(subject)
                    .message(message)
                    .timestamp(LocalDateTime.now())
                    .build());
        } catch (RuntimeException e) {
            log.warn("Could not store notification for user {}: {}", userId, e.getMessage());
        }
    }

    public List<Notification> inbox(String userId) {
        return notificationRepository.findTop50ByUserIdOrderByTimestampDesc(userId);
    }

    public long unreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public Notification markRead(String id, String userId) {
        Notification notification = notificationRepository.findById(id)
                .filter(found -> userId.equals(found.getUserId()))
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(userId);
        unread.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private String sendEmail(NotificationRequest request) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(request.recipient());
            mail.setSubject(request.subject());
            mail.setText(request.message());
            mailSender.send(mail);
            return "Email sent successfully.";
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", request.recipient(), e.getMessage());
            return "Failed to send email: " + e.getMessage();
        }
    }

    // SMS and push are not wired to a provider yet (Twilio/MSG91, Firebase/OneSignal would go here).
    private String sendSms(NotificationRequest request) {
        log.info("SMS to {}: {}", request.recipient(), request.message());
        return "SMS sent (mock).";
    }

    private String sendPush(NotificationRequest request) {
        log.info("Push notification to {}: {}", request.recipient(), request.message());
        return "Push notification sent (mock).";
    }
}
