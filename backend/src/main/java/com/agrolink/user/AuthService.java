package com.agrolink.user;

import com.agrolink.common.exception.ConflictException;
import com.agrolink.security.JwtUtil;
import com.agrolink.security.UserPrincipal;
import com.agrolink.user.dto.JwtResponse;
import com.agrolink.user.dto.LoginRequest;
import com.agrolink.user.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    /**
     * @param allowPrivilegedRoles true only when an admin is creating the account; public sign-ups cannot pick ADMIN or MANAGER
     */
    public void register(RegisterRequest request, boolean allowPrivilegedRoles) {
        UserRole role = UserService.parseRole(request.role());
        if (role.isPrivileged() && !allowPrivilegedRoles) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role " + role + " cannot be chosen during registration");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new ConflictException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEmail(request.email());
        user.setAadhar(request.aadhar());
        user.setContactNumber(request.contactNumber());
        user.setAddress(request.address());
        user.setTwoFactorEnabled(request.twoFactorEnabled());
        user.setRole(role);
        userRepository.save(user);
    }

    public JwtResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String role = principal.getRole() != null ? principal.getRole().name() : null;
        String token = jwtUtil.generateToken(principal.getUsername(), role);

        return new JwtResponse(token, role, jwtUtil.getExpiration(token).toInstant().toString());
    }
}
