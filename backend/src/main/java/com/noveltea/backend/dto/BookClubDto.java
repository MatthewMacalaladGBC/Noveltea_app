package com.noveltea.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

public class BookClubDto {

    // Sent when creating a new book club
    // Creator is the authenticated user (resolved from auth token in service)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {

        @NotBlank
        private String name;

        // nullable
        private String description;
        // nullable; service defaults to false (public) if absent
        private Boolean privacy;

    }

    // Sent when updating an existing club (all nullable, only provided fields are updated)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {

        private String name;
        private String description;
        private Boolean privacy;

    }

    // Returned when viewing club details or club search results
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long bookClubId;
        private String name;
        private String description;
        private Boolean privacy;
        private LocalDate creationDate;

    }

}