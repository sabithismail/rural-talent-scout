package com.ruraltalent.scoring.sport;

import com.ruraltalent.scoring.model.AgeCurve;
import com.ruraltalent.scoring.model.CatalogEntry;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/** Reads catalog.csv. Plain Java on purpose: no extra libraries, easy to test. */
public final class CatalogLoader {

    private CatalogLoader() {
    }

    public static List<CatalogEntry> loadDefault() {
        try (InputStream in = CatalogLoader.class.getResourceAsStream("/catalog.csv")) {
            if (in == null) throw new IllegalStateException("catalog.csv is missing from the classpath");
            return parse(in);
        } catch (IOException e) {
            throw new IllegalStateException("Could not read catalog.csv", e);
        }
    }

    static List<CatalogEntry> parse(InputStream in) throws IOException {
        List<CatalogEntry> entries = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            int number = 0;
            while ((line = reader.readLine()) != null) {
                number++;
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                String[] p = line.split(",", -1);
                if (p.length != 8) {
                    throw new IllegalStateException("catalog.csv line " + number + ": expected 8 fields, found " + p.length);
                }
                try {
                    String hardMax = p[7].trim();
                    entries.add(new CatalogEntry(
                            p[0].trim(), p[1].trim(), p[2].trim(),
                            AgeCurve.valueOf(p[3].trim().toUpperCase()),
                            Double.parseDouble(p[4].trim()), Double.parseDouble(p[5].trim()),
                            Double.parseDouble(p[6].trim()),
                            hardMax.isEmpty() ? null : Double.valueOf(hardMax)));
                } catch (IllegalArgumentException e) {
                    throw new IllegalStateException("catalog.csv line " + number + ": " + e.getMessage(), e);
                }
            }
        }
        return entries;
    }
}
