package com.noveltea.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

public class BookListFollowerDto {

    // Sent when a user follows a public list
    // The follower is the authenticated user, so no need to include directly in request
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {

        @NotNull
        private Long listId;

    }

    // Returned when viewing a list's followers, or the lists a user follows
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long listFollowerId;
        private Long listId;
        // useful when displaying lists a user follows
        private String listTitle;
        private Long userId;
        private String username;
        private LocalDate followedDate;

    }

}