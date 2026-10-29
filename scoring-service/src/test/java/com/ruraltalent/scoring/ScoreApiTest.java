package com.ruraltalent.scoring;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ScoreApiTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void healthSaysJava() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.language").value("Java"));
    }

    @Test
    void listsAllFortySports() throws Exception {
        mvc.perform(get("/api/sports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(40));
    }

    @Test
    void scoresAValidRequest() throws Exception {
        mvc.perform(post("/api/score").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sport\":\"sprint\",\"age\":16,\"gender\":\"male\",\"value\":7.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").isNumber())
                .andExpect(jsonPath("$.ageBand").value("U16"));
    }

    @Test
    void rejectsAnUnrealisticResultWithFriendlyError() throws Exception {
        mvc.perform(post("/api/score").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sport\":\"sprint\",\"age\":16,\"gender\":\"male\",\"value\":1.0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void rejectsMissingFields() throws Exception {
        mvc.perform(post("/api/score").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sport\":\"sprint\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void scoreJobIsDisabledWithoutConfiguration() throws Exception {
        mvc.perform(post("/api/jobs/score-pending"))
                .andExpect(status().isServiceUnavailable());
    }
}
