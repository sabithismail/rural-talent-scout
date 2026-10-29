package com.ruraltalent.scoring.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ScoreRequest(
        @NotBlank String sport,
        @NotNull @Min(5) @Max(80) Integer age,
        String gender,
        @NotNull @PositiveOrZero Double value) {
}
