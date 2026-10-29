package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Number of line touches completed in the 30 second raid drill. */
@Component
public class KabaddiScorer extends BenchmarkScorer {
    public KabaddiScorer() {
        super("kabaddi", "Kabaddi", "touches", 0.90, Map.of(
                AgeBand.U12, new Benchmark(3, 10),
                AgeBand.U14, new Benchmark(4, 12),
                AgeBand.U16, new Benchmark(5, 14),
                AgeBand.U18, new Benchmark(6, 16),
                AgeBand.SENIOR, new Benchmark(6, 16)));
    }
}
