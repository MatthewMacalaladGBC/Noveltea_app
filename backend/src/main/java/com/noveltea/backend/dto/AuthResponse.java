package com.noveltea.backend.dto;

public class AuthResponse {

    private String accessToken;
    private UserResponse user;

    public AuthResponse(String accessToken, UserResponse user) {
        this.accessToken = accessToken;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public UserResponse getUser() { return user; }

    public static class UserResponse {
        private Long userId;
        private String username;
        private String email;

        public UserResponse(Long userId, String username, String email) {
            this.userId = userId;
            this.username = username;
            this.email = email;
        }

        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
    }
}
