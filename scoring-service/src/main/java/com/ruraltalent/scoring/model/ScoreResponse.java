package com.ruraltalent.scoring.model;

public record ScoreResponse(
        String sport,
        String ageBand,
        String gender,
        double value,
        double score,
        String band,
        String bandLabel,
        double floor,
        double elite) {
}
