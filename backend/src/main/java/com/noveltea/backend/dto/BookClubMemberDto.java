package com.noveltea.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

public class BookClubMemberDto {

    // Sent when joining a club
    // The joining user is the authenticated user (no need to include directly in request)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JoinRequest {

        @NotNull
        private Long bookClubId;

    }

    // Sent when updating a member's role (only owner can create / remove moderators)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRoleRequest {

        // the member whose role is being changed
        @NotNull
        private Long userId;

        // "Member", "Moderator", or "Owner" (ownership transfer only if current Owner relinquishes)
        @NotBlank
        private String role;

    }

    // Returned when viewing a club's member list or a user's club memberships
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long clubMemberId;
        private Long bookClubId;
        // useful when displaying a user's club memberships
        private String clubName;
        private Long userId;
        private String username;
        private String role;
        private LocalDate joinedDate;

    }

}