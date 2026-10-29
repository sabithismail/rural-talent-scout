package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Best of three cricket-ball or javelin-style throws, in metres. */
@Component
public class ThrowScorer extends BenchmarkScorer {
    public ThrowScorer() {
        super("throw", "Throwing", "metres", 0.70, Map.of(
                AgeBand.U12, new Benchmark(15, 40),
                AgeBand.U14, new Benchmark(20, 55),
                AgeBand.U16, new Benchmark(25, 65),
                AgeBand.U18, new Benchmark(30, 75),
                AgeBand.SENIOR, new Benchmark(30, 80)));
    }
}
