package com.ruraltalent.scoring.service;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import com.ruraltalent.scoring.model.Gender;
import com.ruraltalent.scoring.model.RankBand;
import com.ruraltalent.scoring.model.ScoreRequest;
import com.ruraltalent.scoring.model.ScoreResponse;
import com.ruraltalent.scoring.sport.ScorerRegistry;
import com.ruraltalent.scoring.sport.SportScorer;
import org.springframework.stereotype.Service;

@Service
public class ScoringService {

    private final ScorerRegistry registry;

    public ScoringService(ScorerRegistry registry) {
        this.registry = registry;
    }

    public ScoreResponse score(ScoreRequest request) {
        return score(request.sport(), request.age(), Gender.from(request.gender()), request.value());
    }

    public ScoreResponse score(String sportSlug, int age, Gender gender, double value) {
        SportScorer scorer = registry.find(sportSlug);
        AgeBand band = AgeBand.of(age);
        Benchmark benchmark = scorer.benchmark(band, gender);

        if (scorer.hardMax().isPresent() && value > scorer.hardMax().getAsDouble()) {
            throw new ScoringException(value + " is more than the maximum possible (" + (long) scorer.hardMax().getAsDouble()
                    + ") for " + scorer.displayName() + ". Please check the number.");
        }
        if (!benchmark.isPlausible(value)) {
            throw new ScoringException("A result of " + value + " " + scorer.unit()
                    + " is not realistic for " + scorer.displayName() + ". Please check the number.");
        }

        double score = round1(scorer.score(value, band, gender));
        RankBand rank = RankBand.of(score);
        return new ScoreResponse(scorer.slug(), band.name(), gender.name(), value, score,
                rank.name(), rank.label(), round1(benchmark.floor()), round1(benchmark.elite()));
    }

    public Benchmark benchmark(String sportSlug, int age, Gender gender) {
        return registry.find(sportSlug).benchmark(AgeBand.of(age), gender);
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
