package com.ruraltalent.scoring.web;

import com.ruraltalent.scoring.model.Benchmark;
import com.ruraltalent.scoring.model.Gender;
import com.ruraltalent.scoring.model.ScoreRequest;
import com.ruraltalent.scoring.model.ScoreResponse;
import com.ruraltalent.scoring.service.ScoringService;
import com.ruraltalent.scoring.sport.ScorerRegistry;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ScoreController {

    private final ScoringService scoring;
    private final ScorerRegistry registry;

    public ScoreController(ScoringService scoring, ScorerRegistry registry) {
        this.scoring = scoring;
        this.registry = registry;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "rural-talent-scoring", "language", "Java");
    }

    @GetMapping("/sports")
    public List<Map<String, String>> sports() {
        return registry.all().stream()
                .map(s -> Map.of("slug", s.slug(), "name", s.displayName(), "unit", s.unit()))
                .toList();
    }

    @PostMapping("/score")
    public ScoreResponse score(@Valid @RequestBody ScoreRequest request) {
        return scoring.score(request);
    }

    @GetMapping("/benchmarks/{sport}")
    public Map<String, Object> benchmark(@PathVariable String sport,
                                         @RequestParam int age,
                                         @RequestParam(required = false) String gender) {
        Benchmark b = scoring.benchmark(sport, age, Gender.from(gender));
        return Map.of("sport", sport, "age", age, "floor", b.floor(), "elite", b.elite(),
                "lowerIsBetter", b.lowerIsBetter());
    }
}
