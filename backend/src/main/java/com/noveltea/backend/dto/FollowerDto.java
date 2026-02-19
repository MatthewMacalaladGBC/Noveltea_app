package com.noveltea.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

public class FollowerDto {

    // Sent when following a user (only the target is needed)
    // the follower is the authenticated user (resolved from auth token in service)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {

        @NotNull
        private Long followedUserId;

    }

    // Returned when querying follow relationships (e.g. follower list, following list)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        // relationship ID
        private Long followerId;
        // the user doing the following
        private Long followerUserId;
        private String followerUsername;
        // the user being followed
        private Long followedUserId;
        private String followedUsername;
        private LocalDate creationDate;

    }

}