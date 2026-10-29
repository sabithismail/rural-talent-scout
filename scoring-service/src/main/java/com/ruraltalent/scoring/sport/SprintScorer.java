package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import org.springframework.stereotype.Component;

import java.util.Map;

/** 40 m sprint, measured in seconds. Lower is better, so floor (0 points) is the slower time. */
@Component
public class SprintScorer extends BenchmarkScorer {
    public SprintScorer() {
        super("sprint", "Sprint (40 m)", "seconds", 1.10, Map.of(
                AgeBand.U12, new Benchmark(9.5, 6.8),
                AgeBand.U14, new Benchmark(8.8, 6.3),
                AgeBand.U16, new Benchmark(8.2, 5.9),
                AgeBand.U18, new Benchmark(7.8, 5.6),
                AgeBand.SENIOR, new Benchmark(7.6, 5.4)));
    }
}
