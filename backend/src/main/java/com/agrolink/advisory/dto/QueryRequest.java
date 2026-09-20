package com.agrolink.advisory.dto;

import jakarta.validation.constraints.NotBlank;

/** The farmer name is taken from the logged-in user. */
public record QueryRequest(@NotBlank String question) {
}
