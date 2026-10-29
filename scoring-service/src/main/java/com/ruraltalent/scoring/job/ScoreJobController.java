package com.ruraltalent.scoring.job;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class ScoreJobController {

    private final SupabaseScoreJob job;
    private final String adminToken;

    public ScoreJobController(SupabaseScoreJob job, @Value("${app.admin-token}") String adminToken) {
        this.job = job;
        this.adminToken = adminToken;
    }

    @PostMapping("/score-pending")
    public ResponseEntity<?> scorePending(@RequestHeader(value = "X-Admin-Token", required = false) String token)
            throws Exception {
        if (adminToken.length() < 16 || !job.configured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "Set SUPABASE_URL, SUPABASE_SERVICE_KEY and an ADMIN_TOKEN of at least 16 characters to enable this job."));
        }
        if (token == null || !MessageDigest.isEqual(
                token.getBytes(StandardCharsets.UTF_8), adminToken.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Bad admin token."));
        }
        return ResponseEntity.ok(job.scorePending());
    }
}
