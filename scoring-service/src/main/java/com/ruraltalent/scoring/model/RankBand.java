package com.ruraltalent.scoring.model;

/** Plain-language label shown to scouts next to the 0-100 score. */
public enum RankBand {
    ELITE(85, "Elite: ready for district or state trials"),
    ADVANCED(70, "Advanced: strong prospect, worth a trial"),
    DEVELOPING(50, "Developing: good base, keep training"),
    BEGINNER(30, "Beginner: building the basics"),
    FOUNDATION(0, "Foundation: just getting started");

    private final int minScore;
    private final String label;

    RankBand(int minScore, String label) {
        this.minScore = minScore;
        this.label = label;
    }

    public String label() {
        return label;
    }

    public static RankBand of(double score) {
        for (RankBand band : values()) {
            if (score >= band.minScore) return band;
        }
        return FOUNDATION;
    }
}
