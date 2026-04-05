package com.noveltea.backend.repository;

import com.noveltea.backend.model.BookClub;
import com.noveltea.backend.model.ChatMessage;
import com.noveltea.backend.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Initial load — newest 50, client reverses for display
    List<ChatMessage> findTop50ByBookClubAndRoomOrderByMessageIdDesc(BookClub bookClub, ChatRoom room);

    // Poll — messages newer than the last seen ID, in ascending order
    List<ChatMessage> findByBookClubAndRoomAndMessageIdGreaterThanOrderByMessageIdAsc(
            BookClub bookClub, ChatRoom room, Long messageId);

    // Scroll-up pagination — 50 messages older than the cursor, in ascending order
    List<ChatMessage> findTop50ByBookClubAndRoomAndMessageIdLessThanOrderByMessageIdDesc(
            BookClub bookClub, ChatRoom room, Long messageId);
}
