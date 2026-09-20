package com.agrolink.advisory.dto;

import jakarta.validation.constraints.NotBlank;

public record QueryResponseRequest(@NotBlank String response) {
}
