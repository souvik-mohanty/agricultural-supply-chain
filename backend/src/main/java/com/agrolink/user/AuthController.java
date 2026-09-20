package com.agrolink.user;

import com.agrolink.user.dto.JwtResponse;
import com.agrolink.user.dto.LoginRequest;
import com.agrolink.user.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final DemoLoginService demoLoginService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request, false);
        return ResponseEntity.ok("User registered successfully");
    }

    /** Bulk account creation (e.g. seeding dummy data). Admin only; may create ADMIN/MANAGER accounts. */
    @PostMapping("/registers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> registerMany(@Valid @RequestBody List<@Valid RegisterRequest> requests) {
        List<String> results = new ArrayList<>();
        for (RegisterRequest request : requests) {
            try {
                authService.register(request, true);
                results.add(request.username() + ": registered");
            } catch (RuntimeException e) {
                results.add(request.username() + ": failed - " + e.getMessage());
            }
        }
        return ResponseEntity.ok(results);
    }

    /** Roles offered by the passwordless demo login. Empty unless DEMO_LOGIN_ENABLED=true. */
    @GetMapping("/demo-login")
    public List<String> demoRoles() {
        return demoLoginService.availableRoles();
    }

    /** Passwordless login for demos. Answers 404 unless DEMO_LOGIN_ENABLED=true. */
    @PostMapping("/demo-login/{role}")
    public ResponseEntity<JwtResponse> demoLogin(@PathVariable String role) {
        return ResponseEntity.ok(demoLoginService.login(role));
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
