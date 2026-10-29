package com.ruraltalent.scoring;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import com.ruraltalent.scoring.model.Gender;
import com.ruraltalent.scoring.model.ScoreResponse;
import com.ruraltalent.scoring.service.ScoringException;
import com.ruraltalent.scoring.service.ScoringService;
import com.ruraltalent.scoring.sport.CricketBowlingScorer;
import com.ruraltalent.scoring.sport.KabaddiScorer;
import com.ruraltalent.scoring.sport.LongJumpScorer;
import com.ruraltalent.scoring.sport.ScorerRegistry;
import com.ruraltalent.scoring.sport.SprintScorer;
import com.ruraltalent.scoring.sport.ThrowScorer;
import com.ruraltalent.scoring.sport.VerticalJumpScorer;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScoringServiceTest {

    private final ScoringService service = new ScoringService(new ScorerRegistry(List.of(
            new SprintScorer(), new VerticalJumpScorer(), new CricketBowlingScorer(),
            new ThrowScorer(), new LongJumpScorer(), new KabaddiScorer())));

    @Test
    void ageBandsAreChosenCorrectly() {
        assertEquals(AgeBand.U12, AgeBand.of(11));
        assertEquals(AgeBand.U14, AgeBand.of(14));
        assertEquals(AgeBand.U16, AgeBand.of(15));
        assertEquals(AgeBand.U18, AgeBand.of(18));
        assertEquals(AgeBand.SENIOR, AgeBand.of(25));
    }

    @Test
    void lowerIsBetterSprintScoresFasterTimesHigher() {
        double slow = service.score("sprint", 16, Gender.MALE, 8.0).score();
        double fast = service.score("sprint", 16, Gender.MALE, 6.2).score();
        assertTrue(fast > slow, "faster sprint must score higher");
    }

    @Test
    void floorScoresZeroAndEliteScoresHundred() {
        // U16 boys sprint benchmark is 8.2 s (0 points) to 5.9 s (100 points)
        assertEquals(0.0, service.score("sprint", 16, Gender.MALE, 8.2).score());
        assertEquals(100.0, service.score("sprint", 16, Gender.MALE, 5.9).score());
        // slower than the floor is clamped to 0, not negative
        assertEquals(0.0, service.score("sprint", 16, Gender.MALE, 9.5).score());
    }

    @Test
    void higherIsBetterJumpMidpointScoresFifty() {
        // U16 boys vertical jump: 25 cm -> 0, 56 cm -> 100, so 40.5 cm is exactly halfway
        assertEquals(50.0, service.score("vertical-jump", 16, Gender.MALE, 40.5).score(), 0.1);
    }

    @Test
    void sameResultScoresHigherForOlderAgeGroupsBeingCompared() {
        double u14 = service.score("vertical-jump", 13, Gender.MALE, 40).score();
        double u18 = service.score("vertical-jump", 17, Gender.MALE, 40).score();
        assertTrue(u14 > u18, "a 13 year old is judged against a lower standard than a 17 year old");
    }

    @Test
    void femaleTableIsScaledFromMaleTable() {
        Benchmark male = new VerticalJumpScorer().benchmark(AgeBand.U16, Gender.MALE);
        Benchmark female = new VerticalJumpScorer().benchmark(AgeBand.U16, Gender.FEMALE);
        assertEquals(male.elite() * 0.80, female.elite(), 1e-9);
        Benchmark mid = new VerticalJumpScorer().benchmark(AgeBand.U16, Gender.UNSPECIFIED);
        assertEquals((male.elite() + female.elite()) / 2, mid.elite(), 1e-9);
    }

    @Test
    void unrealisticResultsAreRejected() {
        assertThrows(ScoringException.class, () -> service.score("sprint", 16, Gender.MALE, 2.0));
        assertThrows(ScoringException.class, () -> service.score("vertical-jump", 16, Gender.MALE, 200));
    }

    @Test
    void unknownSportIsRejected() {
        assertThrows(ScoringException.class, () -> service.score("chess", 16, Gender.MALE, 10));
    }

    @Test
    void responseCarriesRankBandAndBenchmarks() {
        ScoreResponse r = service.score("kabaddi", 17, Gender.MALE, 16);
        assertEquals(100.0, r.score());
        assertEquals("ELITE", r.band());
        assertEquals("U18", r.ageBand());
        assertEquals(6.0, r.floor());
        assertEquals(16.0, r.elite());
    }

    // ----- catalog (data-driven) sports -----

    @Test
    void registryHasAllFortySports() {
        ScorerRegistry registry = new ScorerRegistry(List.of(new SprintScorer(), new VerticalJumpScorer(),
                new CricketBowlingScorer(), new ThrowScorer(), new LongJumpScorer(), new KabaddiScorer()));
        assertEquals(40, registry.all().size());
    }

    @Test
    void everySportScoresZeroAtFloorAndHundredAtElite() {
        ScorerRegistry registry = new ScorerRegistry(List.of());
        for (var scorer : registry.all()) {
            for (AgeBand band : AgeBand.values()) {
                for (Gender g : Gender.values()) {
                    Benchmark b = scorer.benchmark(band, g);
                    assertEquals(0.0, scorer.score(b.floor(), band, g), 1e-9, scorer.slug() + " floor");
                    assertEquals(100.0, scorer.score(b.elite(), band, g), 1e-9, scorer.slug() + " elite");
                }
            }
        }
    }

    @Test
    void swimmingIsLowerIsBetterAndYoungerSwimmersGetMoreTime() {
        assertTrue(service.score("swimming", 18, Gender.MALE, 40).score()
                > service.score("swimming", 18, Gender.MALE, 70).score());
        double u12 = service.score("swimming", 11, Gender.MALE, 60).score();
        double senior = service.score("swimming", 25, Gender.MALE, 60).score();
        assertTrue(u12 > senior, "an 11 year old gets a slower benchmark than an adult");
    }

    @Test
    void accuracyDrillsCannotExceedTheirMaximum() {
        assertThrows(ScoringException.class, () -> service.score("volleyball", 16, Gender.MALE, 11));
        assertEquals(100.0, service.score("volleyball", 16, Gender.MALE, 9).score());
        assertThrows(ScoringException.class, () -> service.score("archery", 16, Gender.FEMALE, 61));
    }

    @Test
    void accuracyDrillsAreTheSameForEveryAgeGroup() {
        assertEquals(service.score("basketball", 11, Gender.MALE, 6).score(),
                service.score("basketball", 25, Gender.MALE, 6).score());
    }

    @Test
    void catalogEntriesLoadFromCsv() {
        var entries = com.ruraltalent.scoring.sport.CatalogLoader.loadDefault();
        assertEquals(34, entries.size());
        assertTrue(entries.stream().anyMatch(e -> e.slug().equals("pull-ups") && e.femaleFactor() == 0.50));
    }
}
