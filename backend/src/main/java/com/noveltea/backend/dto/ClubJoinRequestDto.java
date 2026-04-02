package com.noveltea.backend.dto;

import com.noveltea.backend.model.ClubJoinRequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

public class ClubJoinRequestDto {

    // Sent when requesting to join a private club
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {

        @NotNull
        private Long bookClubId;

    }

    // Returned for both the requester and the owner/mod approval panel
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long requestId;
        private Long bookClubId;
        private String clubName;
        private Long userId;
        private String username;
        private ClubJoinRequestStatus status;
        private LocalDate requestedAt;

    }

}
