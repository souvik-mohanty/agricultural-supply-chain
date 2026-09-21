package com.agrolink.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DemoAccountSeederTest {

    @Mock UserRepository userRepository;

    final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    final Map<String, User> stored = new HashMap<>();

    @BeforeEach
    void fakeCollection() {
        lenient().when(userRepository.findByUsername(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(stored.get(invocation.<String>getArgument(0))));
        lenient().when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            if (user.getId() == null) user.setId("id-" + user.getUsername());
            stored.put(user.getUsername(), user);
            return user;
        });
    }

    private DemoAccountSeeder seeder(boolean enabled) {
        return seeder(enabled, true);
    }

    private DemoAccountSeeder seeder(boolean enabled, boolean includeStaff) {
        return new DemoAccountSeeder(enabled, includeStaff, userRepository, passwordEncoder);
    }

    @Test
    void theListedAccountsCoverEveryRoleAndHaveUniqueNamesAndValidPasswords() {
        Set<UserRole> roles = DemoAccounts.ALL.stream().map(DemoAccounts.Account::role).collect(Collectors.toSet());
        assertThat(roles).containsExactlyInAnyOrder(UserRole.values());
        assertThat(DemoAccounts.ALL).extracting(DemoAccounts.Account::username).doesNotHaveDuplicates();
        // the registration form requires at least 6 characters; the demo passwords should pass the same rule
        assertThat(DemoAccounts.ALL).allSatisfy(account -> assertThat(account.password()).hasSizeGreaterThanOrEqualTo(6));
    }

    @Test
    void whenEnabledEveryAccountIsCreatedWithAHashedPassword() {
        seeder(true).run(null);

        assertThat(stored).hasSize(DemoAccounts.ALL.size());
        for (DemoAccounts.Account account : DemoAccounts.ALL) {
            User user = stored.get(account.username());
            assertThat(user.getRole()).isEqualTo(account.role());
            assertThat(user.getPassword()).isNotEqualTo(account.password()).startsWith("$2"); // BCrypt, not plain text
            assertThat(passwordEncoder.matches(account.password(), user.getPassword())).isTrue();
            assertThat(user.isSuspended()).isFalse();
        }
    }

    @Test
    void runningAgainResetsChangedAccountsWithoutCreatingDuplicates() {
        seeder(true).run(null);
        User ravi = stored.get("farmer_ravi");
        String id = ravi.getId();
        ravi.setPassword(passwordEncoder.encode("changed-by-a-visitor"));
        ravi.setRole(UserRole.ADMIN);
        ravi.setSuspended(true);

        seeder(true).run(null);

        User reset = stored.get("farmer_ravi");
        assertThat(stored).hasSize(DemoAccounts.ALL.size());
        assertThat(reset.getId()).isEqualTo(id);
        assertThat(reset.getRole()).isEqualTo(UserRole.FARMER);
        assertThat(reset.isSuspended()).isFalse();
        assertThat(passwordEncoder.matches("Farmer@123", reset.getPassword())).isTrue();
    }

    @Test
    void withoutStaffOnlyTheNonPrivilegedAccountsAreCreated() {
        seeder(true, false).run(null);

        assertThat(stored).doesNotContainKeys("admin_demo", "manager_demo");
        assertThat(stored).hasSize(DemoAccounts.ALL.size() - 2);
        assertThat(stored.values()).noneMatch(user -> user.getRole().isPrivileged());
        assertThat(DemoAccounts.visible(false)).noneMatch(account -> account.role().isPrivileged());
        assertThat(DemoAccounts.visible(true)).hasSameSizeAs(DemoAccounts.ALL);
    }

    @Test
    void withoutStaffLeftOverStaffAccountsFromAnEarlierRunAreDeleted() {
        seeder(true, true).run(null);
        assertThat(stored).containsKeys("admin_demo", "manager_demo");

        seeder(true, false).run(null);

        verify(userRepository).delete(stored.get("admin_demo"));
        verify(userRepository).delete(stored.get("manager_demo"));
    }

    @Test
    void whenDisabledNothingIsTouched() {
        seeder(false).run(null);

        verifyNoInteractions(userRepository);
    }

    @Test
    void aDatabaseProblemNeverStopsTheApplicationFromStarting() {
        when(userRepository.findByUsername(anyString())).thenThrow(new IllegalStateException("db down"));

        assertThatCode(() -> seeder(true).run(null)).doesNotThrowAnyException();
        verify(userRepository, never()).save(any());
    }
}
