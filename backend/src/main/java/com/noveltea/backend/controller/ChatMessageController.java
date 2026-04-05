package com.noveltea.backend.controller;

import com.noveltea.backend.dto.ChatMessageDto;
import com.noveltea.backend.model.ChatRoom;
import com.noveltea.backend.service.ChatMessageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clubs/{clubId}/chat")
@RequiredArgsConstructor
public class ChatMessageController extends BaseController {

    private final ChatMessageService chatMessageService;

    // POST /clubs/{clubId}/chat — send a message
    @PostMapping
    public ResponseEntity<ChatMessageDto.Response> sendMessage(
            @PathVariable Long clubId,
            @Valid @RequestBody ChatMessageDto.SendRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatMessageService.sendMessage(userId, clubId, request));
    }

    // GET /clubs/{clubId}/chat/{room} — initial load or paginated fetch
    // ?after={id}  → poll for new messages since that ID
    // ?before={id} → load older messages (scroll-up pagination)
    // (no params)  → initial load of 50 most recent
    @GetMapping("/{room}")
    public ResponseEntity<List<ChatMessageDto.Response>> getMessages(
            @PathVariable Long clubId,
            @PathVariable ChatRoom room,
            @RequestParam(required = false) Long after,
            @RequestParam(required = false) Long before,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);

        List<ChatMessageDto.Response> messages;
        if (after != null) {
            messages = chatMessageService.getMessagesSince(userId, clubId, room, after);
        } else if (before != null) {
            messages = chatMessageService.getMessagesBefore(userId, clubId, room, before);
        } else {
            messages = chatMessageService.getRecentMessages(userId, clubId, room);
        }

        return ResponseEntity.ok(messages);
    }
}
