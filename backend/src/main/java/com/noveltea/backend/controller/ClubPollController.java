package com.noveltea.backend.controller;

import com.noveltea.backend.dto.ClubPollDto;
import com.noveltea.backend.service.ClubPollService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ClubPollController extends BaseController {

    private final ClubPollService pollService;

    // POST /clubs/{clubId}/poll — owner/mod creates a poll
    @PostMapping("/clubs/{clubId}/poll")
    public ResponseEntity<ClubPollDto.Response> createPoll(
            @PathVariable Long clubId,
            @Valid @RequestBody ClubPollDto.CreateRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(pollService.createPoll(userId, clubId, request));
    }

    // GET /clubs/{clubId}/poll/active — get the active poll (any authenticated user)
    @GetMapping("/clubs/{clubId}/poll/active")
    public ResponseEntity<ClubPollDto.Response> getActivePoll(
            @PathVariable Long clubId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return pollService.getActivePoll(userId, clubId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // POST /polls/{pollId}/vote — any member votes
    @PostMapping("/polls/{pollId}/vote")
    public ResponseEntity<ClubPollDto.Response> vote(
            @PathVariable Long pollId,
            @Valid @RequestBody ClubPollDto.VoteRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(pollService.vote(userId, pollId, request));
    }

    // POST /polls/{pollId}/close — owner/mod closes a poll
    @PostMapping("/polls/{pollId}/close")
    public ResponseEntity<ClubPollDto.Response> closePoll(
            @PathVariable Long pollId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(pollService.closePoll(userId, pollId));
    }

    // DELETE /polls/{pollId} — owner/mod deletes a poll
    @DeleteMapping("/polls/{pollId}")
    public ResponseEntity<Void> deletePoll(
            @PathVariable Long pollId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        pollService.deletePoll(userId, pollId);
        return ResponseEntity.noContent().build();
    }
}
