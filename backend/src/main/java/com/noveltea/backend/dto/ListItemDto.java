package com.noveltea.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

public class ListItemDto {

    // Sent when adding a book to a list
    // Includes book metadata so the service can register the book in the db if not already present
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {

        @NotNull
        private Long listId;

        // Book fields (passed from Open Library search results)
        @NotBlank
        private String bookId;

        @NotBlank
        private String title;

        @NotBlank
        private String author;

        // nullable
        private String coverImageUrl;

    }

    // Returned when fetching the contents of a list to show individual items
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long listItemId;
        private Long listId;
        private String bookId;
        private String bookTitle;
        private String bookAuthor;
        private String coverImageUrl;
        private Integer sortOrder;
        private LocalDate addedDate;

    }

}