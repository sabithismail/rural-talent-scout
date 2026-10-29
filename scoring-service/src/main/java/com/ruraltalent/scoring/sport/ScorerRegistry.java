package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.CatalogEntry;
import com.ruraltalent.scoring.service.ScoringException;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Spring injects every SportScorer bean here, so new sports are picked up automatically. */
@Component
public class ScorerRegistry {

    private final Map<String, SportScorer> bySlug = new LinkedHashMap<>();

    public ScorerRegistry(List<SportScorer> scorers) {
        for (SportScorer scorer : scorers) {
            bySlug.put(scorer.slug(), scorer);
        }
        // sports defined as data (catalog.csv); a hand-written class with the same slug wins
        for (CatalogEntry entry : CatalogLoader.loadDefault()) {
            bySlug.putIfAbsent(entry.slug(), new CatalogScorer(entry));
        }
    }

    public SportScorer find(String slug) {
        SportScorer scorer = bySlug.get(slug == null ? "" : slug.trim().toLowerCase());
        if (scorer == null) {
            throw new ScoringException("Unknown sport '" + slug + "'. Known sports: " + bySlug.keySet());
        }
        return scorer;
    }

    public Collection<SportScorer> all() {
        return bySlug.values();
    }
}
