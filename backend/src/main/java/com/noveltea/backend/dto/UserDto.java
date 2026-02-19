package com.noveltea.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

public class UserDto {

    // Sent during registration
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {

        @NotBlank
        private String username;

        @NotBlank
        @Email
        private String email;

        // takes plain text on registration; hashed in service layer before persisting
        @NotBlank
        private String password;

    }

    // Sent during login
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {

        @NotBlank
        private String usernameOrEmail;

        @NotBlank
        private String password;

    }

    // Sent when updating profile fields (all nullable, only provided fields are updated)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {

        private String username;
        private String bio;
        private Boolean privacy;

    }

    // Returned by the backend when sending user data to the frontend
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {

        private Long userId;
        private String username;
        private String email;
        private String bio;
        private Boolean privacy;
        private String role;
        private LocalDate joinDate;

    }

}