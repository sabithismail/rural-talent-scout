package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Standing long jump distance in centimetres. */
@Component
public class LongJumpScorer extends BenchmarkScorer {
    public LongJumpScorer() {
        super("long-jump", "Long Jump", "cm", 0.85, Map.of(
                AgeBand.U12, new Benchmark(120, 190),
                AgeBand.U14, new Benchmark(140, 215),
                AgeBand.U16, new Benchmark(160, 240),
                AgeBand.U18, new Benchmark(175, 255),
                AgeBand.SENIOR, new Benchmark(175, 265)));
    }
}
