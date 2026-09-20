package com.agrolink.user;

import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ConflictException;
import com.agrolink.common.exception.ResourceNotFoundException;
import com.agrolink.user.dto.UpdateUserRequest;
import com.agrolink.user.dto.UserProfileDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final int MIN_PASSWORD_LENGTH = 6;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileDTO getById(String id) {
        return UserProfileDTO.from(find(id));
    }

    public UserProfileDTO getByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(UserProfileDTO::from)
                .orElseThrow(() -> new ResourceNotFoundException("User '" + username + "' was not found"));
    }

    public List<UserProfileDTO> listAll() {
        return userRepository.findAll().stream().map(UserProfileDTO::from).toList();
    }

    /** Role changes are only honoured for admins; everyone else gets a 403 instead of a silent no-op. */
    public UserProfileDTO update(String id, UpdateUserRequest request, boolean actorIsAdmin) {
        User user = find(id);

        if (StringUtils.hasText(request.username()) && !request.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.username())) {
                throw new ConflictException("Username already exists");
            }
            user.setUsername(request.username());
        }
        setIfText(request.email(), user::setEmail);
        setIfText(request.aadhar(), user::setAadhar);
        setIfText(request.contactNumber(), user::setContactNumber);
        setIfText(request.address(), user::setAddress);

        if (StringUtils.hasText(request.password())) {
            if (request.password().length() < MIN_PASSWORD_LENGTH) {
                throw new BadRequestException("Password must be at least " + MIN_PASSWORD_LENGTH + " characters");
            }
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        if (StringUtils.hasText(request.role())) {
            UserRole requested = parseRole(request.role());
            if (requested != user.getRole()) {
                if (!actorIsAdmin) {
                    throw new AccessDeniedException("Only an admin can change roles");
                }
                user.setRole(requested);
            }
        }

        if (request.twoFactorEnabled() != null) {
            user.setTwoFactorEnabled(request.twoFactorEnabled());
        }

        return UserProfileDTO.from(userRepository.save(user));
    }

    public void delete(String id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User '" + id + "' was not found");
        }
        userRepository.deleteById(id);
    }

    public void setSuspended(String id, boolean suspended) {
        User user = find(id);
        user.setSuspended(suspended);
        userRepository.save(user);
    }

    public UserProfileDTO changeRole(String id, String role) {
        User user = find(id);
        user.setRole(parseRole(role));
        return UserProfileDTO.from(userRepository.save(user));
    }

    public static UserRole parseRole(String role) {
        try {
            return UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + role);
        }
    }

    private User find(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User '" + id + "' was not found"));
    }

    private void setIfText(String value, Consumer<String> setter) {
        if (StringUtils.hasText(value)) {
            setter.accept(value);
        }
    }
}
