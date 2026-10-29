package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Standing vertical jump height in centimetres. */
@Component
public class VerticalJumpScorer extends BenchmarkScorer {
    public VerticalJumpScorer() {
        super("vertical-jump", "Vertical Jump", "cm", 0.80, Map.of(
                AgeBand.U12, new Benchmark(15, 40),
                AgeBand.U14, new Benchmark(20, 48),
                AgeBand.U16, new Benchmark(25, 56),
                AgeBand.U18, new Benchmark(30, 62),
                AgeBand.SENIOR, new Benchmark(30, 65)));
    }
}
