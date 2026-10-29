package com.ruraltalent.scoring.model;

/**
 * Two reference results for one sport/age group/gender:
 * <ul>
 *   <li>{@code floor}: the result that earns 0 points</li>
 *   <li>{@code elite}: the result that earns 100 points</li>
 * </ul>
 * If floor is bigger than elite, a lower result is better (e.g. a sprint time).
 * One linear formula works for both directions.
 */
public record Benchmark(double floor, double elite) {

    public boolean lowerIsBetter() {
        return floor > elite;
    }

    /** Position of the result between floor (0.0) and elite (1.0), clamped to that range. */
    public double normalise(double value) {
        double fraction = (value - floor) / (elite - floor);
        return Math.max(0.0, Math.min(1.0, fraction));
    }

    /** Results far beyond elite level are almost certainly typing mistakes or fake videos. */
    public boolean isPlausible(double value) {
        return lowerIsBetter() ? value >= elite * 0.6 : value <= elite * 1.6;
    }

    public Benchmark scaledBy(double factor) {
        return new Benchmark(floor * factor, elite * factor);
    }

    public Benchmark averageWith(Benchmark other) {
        return new Benchmark((floor + other.floor) / 2, (elite + other.elite) / 2);
    }
}
