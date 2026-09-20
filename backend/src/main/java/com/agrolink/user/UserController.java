package com.agrolink.user;

import com.agrolink.security.UserPrincipal;
import com.agrolink.user.dto.UpdateUserRequest;
import com.agrolink.user.dto.UserProfileDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final String SELF_OR_ADMIN = "hasRole('ADMIN') or #id == authentication.principal.id";

    private final UserService userService;

    @GetMapping("/me")
    public UserProfileDTO me(@AuthenticationPrincipal UserPrincipal principal) {
        return userService.getById(principal.getId());
    }

    @GetMapping("/{id}")
    @PreAuthorize(SELF_OR_ADMIN)
    public UserProfileDTO getById(@PathVariable String id) {
        return userService.getById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize(SELF_OR_ADMIN)
    public ResponseEntity<String> update(@PathVariable String id,
                                         @Valid @RequestBody UpdateUserRequest request,
                                         @AuthenticationPrincipal UserPrincipal principal) {
        userService.update(id, request, principal.isAdmin());
        return ResponseEntity.ok("User updated successfully");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(SELF_OR_ADMIN)
    public ResponseEntity<String> delete(@PathVariable String id) {
        userService.delete(id);
        return ResponseEntity.ok("User deleted successfully");
    }
}
