package com.agrolink.user;

public enum UserRole {
    ADMIN,
    MANAGER,
    CUSTOMER,
    FARMER,
    BUYER,
    CARRIER,
    WAREHOUSE_OPERATOR,
    ADVISOR;

    /** Staff roles can only be granted by an admin, never through self-registration. */
    public boolean isPrivileged() {
        return this == ADMIN || this == MANAGER;
    }
}
