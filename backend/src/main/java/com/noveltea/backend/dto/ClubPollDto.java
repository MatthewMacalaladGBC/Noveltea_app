package com.noveltea.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class ClubPollDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank
        private String question;

        @NotNull
        @Size(min = 2, max = 10, message = "A poll must have between 2 and 10 options")
        private List<@NotBlank String> options;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoteRequest {
        @NotNull
        private Long optionId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OptionResponse {
        private Long optionId;
        private String optionText;
        private int voteCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long pollId;
        private Long clubId;
        private String question;
        private boolean active;
        private LocalDateTime createdAt;
        private String createdByUsername;
        private List<OptionResponse> options;
        // Which option the requesting user voted for (null if not voted)
        private Long userVotedOptionId;
    }
}
