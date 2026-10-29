package com.ruraltalent.scoring.model;

/** Standard school sports age groups. A player is always compared with their own age group. */
public enum AgeBand {
    U12, U14, U16, U18, SENIOR;

    public static AgeBand of(int age) {
        if (age <= 12) return U12;
        if (age <= 14) return U14;
        if (age <= 16) return U16;
        if (age <= 18) return U18;
        return SENIOR;
    }
}
