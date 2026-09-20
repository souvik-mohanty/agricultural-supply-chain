package com.agrolink.notification;

import com.agrolink.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationInboxTest {

    @Mock NotificationRepository repository;
    @Mock JavaMailSender mailSender;

    NotificationService service;

    @BeforeEach
    void setUp() {
        service = new NotificationService(repository, mailSender);
    }

    private static Notification stored(String id, String userId, boolean read) {
        return Notification.builder().id(id).userId(userId).type("IN_APP").subject("s").message("m").read(read).build();
    }

    @Test
    void anInAppNotificationLandsUnreadInTheUsersInbox() {
        service.notifyUser("u1", "Quote received", "A quote arrived");

        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo("u1");
        assertThat(saved.getValue().getType()).isEqualTo("IN_APP");
        assertThat(saved.getValue().isRead()).isFalse();
        assertThat(saved.getValue().getTimestamp()).isNotNull();
        verify(mailSender, never()).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    void aFailingDatabaseNeverBreaksTheCaller() {
        when(repository.save(any())).thenThrow(new IllegalStateException("db down"));

        assertThatCode(() -> service.notifyUser("u1", "s", "m")).doesNotThrowAnyException();
    }

    @Test
    void markingReadWorksOnlyOnYourOwnNotifications() {
        Notification mine = stored("n1", "u1", false);
        when(repository.findById("n1")).thenReturn(Optional.of(mine));
        when(repository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(service.markRead("n1", "u1").isRead()).isTrue();
        assertThatThrownBy(() -> service.markRead("n1", "someone-else")).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.markRead("missing", "u1")).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markAllReadFlipsEveryUnreadOne() {
        List<Notification> unread = List.of(stored("n1", "u1", false), stored("n2", "u1", false));
        when(repository.findByUserIdAndReadFalse("u1")).thenReturn(unread);

        service.markAllRead("u1");

        assertThat(unread).allMatch(Notification::isRead);
        verify(repository).saveAll(unread);
    }

    @Test
    void inboxAndUnreadCountComeFromTheCallersOwnMessages() {
        when(repository.findTop50ByUserIdOrderByTimestampDesc("u1")).thenReturn(List.of(stored("n1", "u1", false)));
        when(repository.countByUserIdAndReadFalse("u1")).thenReturn(3L);

        assertThat(service.inbox("u1")).hasSize(1);
        assertThat(service.unreadCount("u1")).isEqualTo(3L);
    }
}
