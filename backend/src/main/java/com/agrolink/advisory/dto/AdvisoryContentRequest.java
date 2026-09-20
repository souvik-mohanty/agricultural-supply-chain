package com.agrolink.advisory.dto;

import jakarta.validation.constraints.NotBlank;

/** {@code type} is a free label such as blog, tip or video. The advisor name is taken from the logged-in user. */
public record AdvisoryContentRequest(String type, @NotBlank String title, @NotBlank String content) {
}
