package com.noveltea.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ReviewDto {

    // Sent when creating a review
    // Includes book metadata so the service can register the book in the db if not already present
    // The reviewing user is the authenticated user (no need to include directly in request)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {

        // Book fields (passed directly from Open Library search results)
        @NotBlank
        private String bookId;

        @NotBlank
        private String title;

        @NotBlank
        private String author;

        // nullable
        private String coverImageUrl;

        @NotNull
        @DecimalMin("0.0")
        @DecimalMax("5.0")
        private BigDecimal rating;

        // nullable; rating-only reviews are allowed
        private String reviewText;
        // nullable; service defaults to public (true) if absent
        private Boolean visibility;

    }

    // Sent when updating an existing review
    // All nullable, only provided fields are updated
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {

        @DecimalMin("0.0")
        @DecimalMax("5.0")
        private BigDecimal rating;

        private String reviewText;
        private Boolean visibility;

    }

    // Returned when displaying reviews on a book page or user profile
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long reviewId;
        private Long userId;
        private String username;
        private String bookId;
        private String bookTitle;
        private String bookAuthor;
        private String coverImageUrl;
        private BigDecimal rating;
        private String reviewText;
        private Integer likes;
        private Boolean visibility;
        private LocalDate creationDate;

    }

}