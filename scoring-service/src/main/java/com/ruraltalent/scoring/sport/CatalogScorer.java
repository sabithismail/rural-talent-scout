package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.AgeBand;
import com.ruraltalent.scoring.model.Benchmark;
import com.ruraltalent.scoring.model.CatalogEntry;

import java.util.EnumMap;
import java.util.Map;

/** A scorer built from a data line instead of a hand-written class. Same behaviour, no new code per sport. */
public class CatalogScorer extends BenchmarkScorer {

    public CatalogScorer(CatalogEntry entry) {
        super(entry.slug(), entry.name(), entry.unit(), entry.femaleFactor(), tableFor(entry), entry.hardMax());
    }

    private static Map<AgeBand, Benchmark> tableFor(CatalogEntry entry) {
        Map<AgeBand, Benchmark> table = new EnumMap<>(AgeBand.class);
        for (AgeBand band : AgeBand.values()) {
            double f = entry.curve().factor(band);
            table.put(band, new Benchmark(entry.seniorFloor() * f, entry.seniorElite() * f));
        }
        return table;
    }
}
