package com.noveltea.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

public class BookDto {

    // Sent by the frontend when a user first references a book (add to list, write review, etc.)
    // The frontend already has this data from the Open Library API search results.
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {

        // Open Library ID (e.g. "OL7353617M")
        @NotBlank
        private String bookId;

        @NotBlank
        private String title;

        @NotBlank
        private String author;

        // nullable; placeholder used on frontend if absent
        private String coverImageUrl;
        // nullable; fetched on-demand from Open Library if absent
        private String description;

    }

    // Returned by the backend when sending book data to the frontend
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private String bookId;
        private String title;
        private String author;
        private BigDecimal rating;
        private String description;
        private String coverImageUrl;

    }

}