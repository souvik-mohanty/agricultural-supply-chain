package com.agrolink.user.dto;

public record JwtResponse(String token, String role, String expiresAt) {
}
