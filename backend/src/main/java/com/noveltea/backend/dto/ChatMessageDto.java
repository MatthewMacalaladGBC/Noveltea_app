package com.noveltea.backend.dto;

import com.noveltea.backend.model.ChatRoom;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

public class ChatMessageDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendRequest {
        @NotNull
        private ChatRoom room;

        @NotBlank
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long messageId;
        private Long clubId;
        private String room;
        private Long senderUserId;
        private String senderUsername;
        private String content;
        private LocalDateTime sentAt;
        // Nullable — only set for BOOK_DISCUSSION messages when a book was active
        private String bookId;
        private String bookTitle;
        private String bookCoverUrl;
    }
}
