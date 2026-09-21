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
import org.springframework.util.StringUtils;
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
        // a malformed role is a bad request whatever the password is
        UserRole requestedRole = StringUtils.hasText(request.role()) ? UserService.parseRole(request.role()) : null;

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        // Checked only after the password was verified, so a wrong password never reveals which role an account has.
        if (requestedRole != null && principal.getRole() != requestedRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This account is registered as " + label(principal.getRole()) + ", not " + label(requestedRole)
                            + ". Choose the matching role to sign in.");
        }
        String role = principal.getRole() != null ? principal.getRole().name() : null;
        String token = jwtUtil.generateToken(principal.getUsername(), role);

        return new JwtResponse(token, role, jwtUtil.getExpiration(token).toInstant().toString());
    }

    /** WAREHOUSE_OPERATOR -> "Warehouse operator" */
    private static String label(UserRole role) {
        if (role == null) {
            return "no role";
        }
        String name = role.name().replace('_', ' ').toLowerCase();
        return Character.toUpperCase(name.charAt(0)) + name.substring(1);
    }
}
