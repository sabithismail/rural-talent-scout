package com.ruraltalent.scoring.model;

/**
 * How a senior benchmark is scaled down for younger age groups.
 * Times get slower for children (factor above 1), distances and counts get smaller (factor below 1),
 * and accuracy drills such as "6 out of 10 serves" are the same at every age (FLAT).
 */
public enum AgeCurve {
    TIME(1.25, 1.14, 1.06, 1.02, 1.0),
    DISTANCE(0.55, 0.70, 0.85, 0.95, 1.0),
    COUNT(0.60, 0.75, 0.88, 0.96, 1.0),
    FLAT(1.0, 1.0, 1.0, 1.0, 1.0);

    private final double[] factors;

    AgeCurve(double... factors) {
        this.factors = factors;
    }

    public double factor(AgeBand band) {
        return factors[band.ordinal()];
    }
}
