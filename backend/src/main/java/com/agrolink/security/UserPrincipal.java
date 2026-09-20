package com.agrolink.security;

import com.agrolink.user.User;
import com.agrolink.user.UserRole;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/** The authenticated user. Carries the database id so controllers never have to trust an id sent by the client. */
@Getter
public class UserPrincipal implements UserDetails {

    private final String id;
    private final String username;
    private final String password;
    private final UserRole role;
    private final boolean suspended;

    public UserPrincipal(String id, String username, String password, UserRole role, boolean suspended) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role;
        this.suspended = suspended;
    }

    public static UserPrincipal from(User user) {
        return new UserPrincipal(user.getId(), user.getUsername(), user.getPassword(), user.getRole(), user.isSuspended());
    }

    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return role == null ? List.of() : List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isEnabled() {
        return !suspended;
    }
}
