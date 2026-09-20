package com.agrolink.common.exception;

import org.springframework.http.HttpStatus;

import java.time.Instant;

/** JSON body returned for every error response. */
public record ApiError(Instant timestamp, int status, String error, String message, String path) {

    public static ApiError of(HttpStatus status, String message, String path) {
        return new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, path);
    }
}
