package com.noveltea.backend.service;

import com.noveltea.backend.dto.ChatMessageDto;
import com.noveltea.backend.exception.ForbiddenException;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.*;
import com.noveltea.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final BookClubRepository bookClubRepository;
    private final BookClubMemberRepository bookClubMemberRepository;
    private final BookClubItemRepository bookClubItemRepository;
    private final UserRepository userRepository;

    // POST — send a message; auto-attaches current active book for BOOK_DISCUSSION
    @Transactional
    public ChatMessageDto.Response sendMessage(Long userId, Long clubId, ChatMessageDto.SendRequest request) {
        BookClub club = bookClubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        requireMember(userId, club);

        ChatMessage.ChatMessageBuilder builder = ChatMessage.builder()
                .bookClub(club)
                .sender(sender)
                .room(request.getRoom())
                .content(request.getContent());

        // Snapshot the active book for BOOK_DISCUSSION messages
        if (request.getRoom() == ChatRoom.BOOK_DISCUSSION) {
            bookClubItemRepository.findFirstByBookClubAndStatus(club, BookClubItemStatus.ACTIVE)
                    .ifPresent(item -> builder
                            .bookId(item.getBook().getBookId())
                            .bookTitle(item.getBook().getTitle())
                            .bookCoverUrl(item.getBook().getCoverImageUrl()));
        }

        return toResponse(chatMessageRepository.save(builder.build()));
    }

    // GET — initial load (no cursor), newest 50 returned in ascending order
    @Transactional(readOnly = true)
    public List<ChatMessageDto.Response> getRecentMessages(Long userId, Long clubId, ChatRoom room) {
        BookClub club = requireAccess(userId, clubId);
        List<ChatMessage> messages = chatMessageRepository
                .findTop50ByBookClubAndRoomOrderByMessageIdDesc(club, room);
        // Reverse to chronological (oldest first) for display
        Collections.reverse(messages);
        return messages.stream().map(this::toResponse).toList();
    }

    // GET — poll for messages newer than a given ID (ascending)
    @Transactional(readOnly = true)
    public List<ChatMessageDto.Response> getMessagesSince(Long userId, Long clubId, ChatRoom room, Long afterId) {
        BookClub club = requireAccess(userId, clubId);
        return chatMessageRepository
                .findByBookClubAndRoomAndMessageIdGreaterThanOrderByMessageIdAsc(club, room, afterId)
                .stream().map(this::toResponse).toList();
    }

    // GET — scroll-up pagination; returns 50 messages older than cursor, ascending
    @Transactional(readOnly = true)
    public List<ChatMessageDto.Response> getMessagesBefore(Long userId, Long clubId, ChatRoom room, Long beforeId) {
        BookClub club = requireAccess(userId, clubId);
        List<ChatMessage> messages = chatMessageRepository
                .findTop50ByBookClubAndRoomAndMessageIdLessThanOrderByMessageIdDesc(club, room, beforeId);
        Collections.reverse(messages);
        return messages.stream().map(this::toResponse).toList();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void requireMember(Long userId, BookClub club) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (!bookClubMemberRepository.existsByUserAndBookClub(user, club)) {
            throw new ForbiddenException("You must be a member to chat in this club");
        }
    }

    private BookClub requireAccess(Long userId, Long clubId) {
        BookClub club = bookClubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        // Private clubs: only members can read chat
        if (Boolean.TRUE.equals(club.getPrivacy())
                && !bookClubMemberRepository.existsByUserAndBookClub(user, club)) {
            throw new ForbiddenException("Not a member of this club");
        }
        return club;
    }

    private ChatMessageDto.Response toResponse(ChatMessage m) {
        return ChatMessageDto.Response.builder()
                .messageId(m.getMessageId())
                .clubId(m.getBookClub().getBookClubId())
                .room(m.getRoom().name())
                .senderUserId(m.getSender().getUserId())
                .senderUsername(m.getSender().getUsername())
                .content(m.getContent())
                .sentAt(m.getSentAt())
                .bookId(m.getBookId())
                .bookTitle(m.getBookTitle())
                .bookCoverUrl(m.getBookCoverUrl())
                .build();
    }
}
