package com.ruraltalent.scoring.job;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ruraltalent.scoring.model.Gender;
import com.ruraltalent.scoring.model.ScoreResponse;
import com.ruraltalent.scoring.service.ScoringException;
import com.ruraltalent.scoring.service.ScoringService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Reads validated submissions (passed the video checker) that have a reported result, scores them with the Java engine
 * and writes score + status back to Supabase. Uses the service key, so it must only run on the
 * server and never be exposed in the website code.
 */
@Service
public class SupabaseScoreJob {

    private final ScoringService scoring;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();
    private final String baseUrl;
    private final String serviceKey;

    public SupabaseScoreJob(ScoringService scoring,
                            @Value("${supabase.url}") String baseUrl,
                            @Value("${supabase.service-key}") String serviceKey) {
        this.scoring = scoring;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.serviceKey = serviceKey;
    }

    public boolean configured() {
        return !baseUrl.isBlank() && !serviceKey.isBlank();
    }

    public Map<String, Integer> scorePending() throws IOException, InterruptedException {
        String select = "id,reported_value,sports(slug),profiles(age,gender)";
        String query = "/rest/v1/submissions?status=eq.validated&reported_value=not.is.null&select="
                + select + "&limit=200";
        JsonNode rows = mapper.readTree(send(request(query).GET().build()));

        int scored = 0, rejected = 0, skipped = 0;
        for (JsonNode row : rows) {
            JsonNode age = row.path("profiles").path("age");
            String slug = row.path("sports").path("slug").asText("");
            if (age.isNull() || age.isMissingNode() || slug.isBlank()) {
                skipped++; // player has not filled in their age yet
                continue;
            }
            double value = row.path("reported_value").asDouble();
            Gender gender = Gender.from(row.path("profiles").path("gender").asText(null));
            ObjectNode patch = mapper.createObjectNode();
            try {
                ScoreResponse result = scoring.score(slug, age.asInt(), gender, value);
                patch.put("status", "scored");
                patch.put("score", result.score());
                patch.put("metric_value", value);
                patch.set("analysis", mapper.valueToTree(result));
                scored++;
            } catch (ScoringException e) {
                patch.put("status", "rejected");
                patch.putObject("analysis").put("reason", e.getMessage());
                rejected++;
            }
            String path = "/rest/v1/submissions?id=eq." + row.path("id").asText();
            send(request(path)
                    .header("Content-Type", "application/json")
                    .header("Prefer", "return=minimal")
                    .method("PATCH", HttpRequest.BodyPublishers.ofString(patch.toString()))
                    .build());
        }
        Map<String, Integer> summary = new LinkedHashMap<>();
        summary.put("scored", scored);
        summary.put("rejected", rejected);
        summary.put("skipped", skipped);
        return summary;
    }

    private HttpRequest.Builder request(String pathAndQuery) {
        return HttpRequest.newBuilder(URI.create(baseUrl + pathAndQuery))
                .header("apikey", serviceKey)
                .header("Authorization", "Bearer " + serviceKey);
    }

    private String send(HttpRequest req) throws IOException, InterruptedException {
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 300) {
            throw new IOException("Supabase returned " + res.statusCode() + ": " + res.body());
        }
        return res.body();
    }
}
