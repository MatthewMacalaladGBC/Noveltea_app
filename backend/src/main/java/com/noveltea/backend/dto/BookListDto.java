package com.noveltea.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

public class BookListDto {

    // Sent when creating a new list
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {

        @NotBlank
        private String title;

        // nullable
        private String description;
        // nullable; service defaults to public (true) if absent
        private Boolean visibility;

    }

    // Sent when updating an existing list (all nullable, only provided fields are updated)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {

        private String title;
        private String description;
        private Boolean visibility;

    }

    // Returned by the backend when sending list data to the frontend
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long listId;
        private Long creatorId;
        private String creatorUsername;
        private String title;
        private String description;
        private Boolean visibility;
        private LocalDate creationDate;

    }

}