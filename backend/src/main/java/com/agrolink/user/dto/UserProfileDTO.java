package com.agrolink.user.dto;

import com.agrolink.user.User;

public record UserProfileDTO(
        String id,
        String username,
        String email,
        String aadhar,
        String role,
        String contactNumber,
        String address,
        boolean twoFactorEnabled,
        boolean suspended) {

    public static UserProfileDTO from(User user) {
        return new UserProfileDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getAadhar(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getContactNumber(),
                user.getAddress(),
                user.isTwoFactorEnabled(),
                user.isSuspended());
    }
}
