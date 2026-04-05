package com.noveltea.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

public class ClubAnnouncementDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        @NotBlank
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long announcementId;
        private Long clubId;
        private String authorUsername;
        private String content;
        private LocalDateTime updatedAt;
    }
}
