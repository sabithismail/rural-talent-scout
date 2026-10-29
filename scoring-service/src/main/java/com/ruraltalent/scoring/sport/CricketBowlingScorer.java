package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 6-ball spell. A coach or the player awards up to 6 points per ball
 * (6 = hit the target spot at good pace), so the maximum is 36.
 */
@Component
public class CricketBowlingScorer extends BenchmarkScorer {
    public CricketBowlingScorer() {
        super("cricket-bowling", "Cricket Bowling", "points", 1.0, Map.of(
                AgeBand.U12, new Benchmark(4, 26),
                AgeBand.U14, new Benchmark(5, 28),
                AgeBand.U16, new Benchmark(6, 30),
                AgeBand.U18, new Benchmark(6, 32),
                AgeBand.SENIOR, new Benchmark(6, 33)));
    }
}
