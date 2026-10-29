package com.ruraltalent.scoring.model;

/** Benchmarks differ by gender. UNSPECIFIED uses the midpoint of the two tables. */
public enum Gender {
    MALE, FEMALE, UNSPECIFIED;

    public static Gender from(String text) {
        if (text == null) return UNSPECIFIED;
        return switch (text.trim().toLowerCase()) {
            case "male", "m", "boy" -> MALE;
            case "female", "f", "girl" -> FEMALE;
            default -> UNSPECIFIED;
        };
    }
}
