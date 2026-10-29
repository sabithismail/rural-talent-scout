package com.ruraltalent.scoring.service;

/** A request the engine cannot score (unknown sport, unrealistic result). Mapped to HTTP 400. */
public class ScoringException extends RuntimeException {
    public ScoringException(String message) {
        super(message);
    }
}
