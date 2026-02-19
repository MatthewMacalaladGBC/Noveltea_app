package com.noveltea.backend.dto;

import com.noveltea.backend.model.BookClubItemStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

public class BookClubItemDto {

    // Sent when adding a book to a club's reading list
    // Includes book metadata so the service can register the book in the db if not already present
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddRequest {

        @NotNull
        private Long bookClubId;

        // Book fields (passed from Open Library search results)
        @NotBlank
        private String bookId;

        @NotBlank
        private String title;

        @NotBlank
        private String author;

        // nullable
        private String coverImageUrl;
        // nullable; always ignored — addBook always starts as UPCOMING
        private BookClubItemStatus status;

    }

    // Sent when updating a club item's status or reading dates
    // All nullable, only provided fields are updated
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {

        // nullable; UPCOMING, ACTIVE, or COMPLETED
        private BookClubItemStatus status;
        // nullable; set when transitioning to Active, if not manually done
        private LocalDate startDate;
        // nullable
        private LocalDate endDate;

    }

    // Returned when viewing a club's reading list
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long clubItemId;
        private Long bookClubId;
        private String bookId;
        private String bookTitle;
        private String bookAuthor;
        private String coverImageUrl;
        private BookClubItemStatus status;
        private LocalDate startDate;
        private LocalDate endDate;
        private LocalDate addedDate;

    }

}