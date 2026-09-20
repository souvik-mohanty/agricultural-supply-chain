package com.agrolink.user;

import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ConflictException;
import com.agrolink.user.dto.UpdateUserRequest;
import com.agrolink.user.dto.UserProfileDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;

    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    UserService userService;
    User farmer;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
        farmer = new User();
        farmer.setId("u1");
        farmer.setUsername("farmer1");
        farmer.setPassword(passwordEncoder.encode("old-password"));
        farmer.setRole(UserRole.FARMER);
    }

    private static UpdateUserRequest update(String username, String password, String role) {
        return new UpdateUserRequest(username, password, null, null, null, null, role, null);
    }

    private void givenFarmerExists() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(farmer));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void aUserCannotPromoteThemselves() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(farmer));

        assertThatThrownBy(() -> userService.update("u1", update(null, null, "ADMIN"), false))
                .isInstanceOf(AccessDeniedException.class);

        assertThat(farmer.getRole()).isEqualTo(UserRole.FARMER);
        verify(userRepository, never()).save(any());
    }

    @Test
    void resendingTheCurrentRoleIsHarmless() {
        givenFarmerExists();

        UserProfileDTO result = userService.update("u1", update(null, null, "farmer"), false);

        assertThat(result.role()).isEqualTo("FARMER");
    }

    @Test
    void anAdminCanChangeRoles() {
        givenFarmerExists();

        assertThat(userService.update("u1", update(null, null, "ADVISOR"), true).role()).isEqualTo("ADVISOR");
    }

    @Test
    void blankFieldsLeaveStoredValuesUntouched() {
        givenFarmerExists();
        String originalHash = farmer.getPassword();

        userService.update("u1", update("  ", "", ""), false);

        assertThat(farmer.getUsername()).isEqualTo("farmer1");
        assertThat(farmer.getPassword()).isEqualTo(originalHash);
    }

    @Test
    void newPasswordsAreHashed() {
        givenFarmerExists();

        userService.update("u1", update(null, "new-password", null), false);

        assertThat(passwordEncoder.matches("new-password", farmer.getPassword())).isTrue();
    }

    @Test
    void tooShortPasswordsAreRejected() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(farmer));

        assertThatThrownBy(() -> userService.update("u1", update(null, "123", null), false))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void cannotTakeAnotherUsersUsername() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(farmer));
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        assertThatThrownBy(() -> userService.update("u1", update("taken", null, null), false))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void unknownRolesAreRejected() {
        assertThatThrownBy(() -> UserService.parseRole("SUPERUSER")).isInstanceOf(BadRequestException.class);
    }
}
