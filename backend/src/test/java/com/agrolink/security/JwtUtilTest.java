package com.agrolink.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private static final String SECRET = "test-secret-that-is-at-least-32-bytes-long";

    @Test
    void generatedTokenCarriesTheUsernameAndExpiry() {
        JwtUtil jwtUtil = new JwtUtil(SECRET, 60_000);

        String token = jwtUtil.generateToken("farmer1", "FARMER");

        assertThat(jwtUtil.parse(token).getSubject()).isEqualTo("farmer1");
        assertThat(jwtUtil.parse(token).get("roles", String.class)).isEqualTo("FARMER");
        assertThat(jwtUtil.getExpiration(token)).isAfter(new java.util.Date());
    }

    @Test
    void expiredTokenIsRejected() {
        JwtUtil jwtUtil = new JwtUtil(SECRET, -1_000);

        String token = jwtUtil.generateToken("farmer1", "FARMER");

        assertThatThrownBy(() -> jwtUtil.parse(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        String token = new JwtUtil("another-secret-that-is-also-32-bytes-long!", 60_000).generateToken("farmer1", "FARMER");

        assertThatThrownBy(() -> new JwtUtil(SECRET, 60_000).parse(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void shortSecretFailsFast() {
        assertThatThrownBy(() -> new JwtUtil("too-short", 60_000))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }
}
