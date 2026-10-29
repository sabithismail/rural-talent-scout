package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import com.ruraltalent.scoring.model.Gender;

import java.util.OptionalDouble;

/** One implementation per sport. Add a new sport by adding a new class, nothing else changes. */
public interface SportScorer {

    /** Same slug as the sports table in the database, e.g. "vertical-jump". */
    String slug();

    String displayName();

    String unit();

    Benchmark benchmark(AgeBand band, Gender gender);

    /** Highest possible result for drills with a natural maximum, such as 10 serves. Empty if there is none. */
    default OptionalDouble hardMax() {
        return OptionalDouble.empty();
    }

    /** Converts a measured result into a 0-100 score for the given player. */
    default double score(double value, AgeBand band, Gender gender) {
        return benchmark(band, gender).normalise(value) * 100.0;
    }
}
