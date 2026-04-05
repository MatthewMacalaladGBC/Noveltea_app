package com.noveltea.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "chat_messages",
    indexes = {
        // Efficient cursor-based pagination per club+room
        @Index(name = "idx_chat_club_room_id", columnList = "book_club_id, room, message_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messageId;

    @ManyToOne
    @JoinColumn(name = "book_club_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private BookClub bookClub;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRoom room;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    // Denormalized snapshot of the active book at send time (BOOK_DISCUSSION only).
    // Stored directly so historical context is preserved even if the club item is later removed.
    @Column
    private String bookId;

    @Column
    private String bookTitle;

    @Column
    private String bookCoverUrl;
}
