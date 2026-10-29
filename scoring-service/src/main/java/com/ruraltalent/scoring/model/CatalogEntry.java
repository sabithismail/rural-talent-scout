package com.ruraltalent.scoring.model;

/** One line of catalog.csv. {@code hardMax} is null unless the drill has a natural maximum (e.g. 10 serves). */
public record CatalogEntry(
        String slug,
        String name,
        String unit,
        AgeCurve curve,
        double seniorFloor,
        double seniorElite,
        double femaleFactor,
        Double hardMax) {
}
