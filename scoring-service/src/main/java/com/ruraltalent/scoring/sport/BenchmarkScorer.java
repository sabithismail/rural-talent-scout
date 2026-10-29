package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import com.ruraltalent.scoring.model.Gender;

import java.util.EnumMap;
import java.util.Map;
import java.util.OptionalDouble;

/**
 * Shared logic for sports scored against a benchmark table.
 * Subclasses only supply the male table and a factor that converts it to the female table.
 */
public abstract class BenchmarkScorer implements SportScorer {

    private final String slug;
    private final String displayName;
    private final String unit;
    private final double femaleFactor;
    private final OptionalDouble hardMax;
    private final Map<AgeBand, Benchmark> maleTable = new EnumMap<>(AgeBand.class);

    protected BenchmarkScorer(String slug, String displayName, String unit,
                              double femaleFactor, Map<AgeBand, Benchmark> maleTable) {
        this(slug, displayName, unit, femaleFactor, maleTable, null);
    }

    protected BenchmarkScorer(String slug, String displayName, String unit,
                              double femaleFactor, Map<AgeBand, Benchmark> maleTable, Double hardMax) {
        this.hardMax = hardMax == null ? OptionalDouble.empty() : OptionalDouble.of(hardMax);
        this.slug = slug;
        this.displayName = displayName;
        this.unit = unit;
        this.femaleFactor = femaleFactor;
        this.maleTable.putAll(maleTable);
        for (AgeBand band : AgeBand.values()) {
            if (!this.maleTable.containsKey(band)) {
                throw new IllegalArgumentException(slug + " is missing a benchmark for " + band);
            }
        }
    }

    @Override public String slug() { return slug; }
    @Override public String displayName() { return displayName; }
    @Override public String unit() { return unit; }
    @Override public OptionalDouble hardMax() { return hardMax; }

    @Override
    public Benchmark benchmark(AgeBand band, Gender gender) {
        Benchmark male = maleTable.get(band);
        Benchmark female = male.scaledBy(femaleFactor);
        return switch (gender) {
            case MALE -> male;
            case FEMALE -> female;
            case UNSPECIFIED -> male.averageWith(female);
        };
    }
}
