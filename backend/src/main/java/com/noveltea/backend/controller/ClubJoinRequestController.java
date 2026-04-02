package com.noveltea.backend.controller;

import com.noveltea.backend.dto.BookClubMemberDto;
import com.noveltea.backend.dto.ClubJoinRequestDto;
import com.noveltea.backend.service.ClubJoinRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/club-join-requests")
@RequiredArgsConstructor
public class ClubJoinRequestController extends BaseController {

    private final ClubJoinRequestService clubJoinRequestService;

    // POST /club-join-requests — request to join a private club
    @PostMapping
    public ResponseEntity<ClubJoinRequestDto.Response> requestJoin(
            @Valid @RequestBody ClubJoinRequestDto.CreateRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(clubJoinRequestService.requestJoin(userId, request));
    }

    // DELETE /club-join-requests/{requestId} — cancel own pending request
    @DeleteMapping("/{requestId}")
    public ResponseEntity<Void> cancelRequest(
            @PathVariable Long requestId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        clubJoinRequestService.cancelRequest(userId, requestId);
        return ResponseEntity.noContent().build();
    }

    // POST /club-join-requests/{requestId}/approve — owner/mod approves
    @PostMapping("/{requestId}/approve")
    public ResponseEntity<BookClubMemberDto.Response> approveRequest(
            @PathVariable Long requestId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(clubJoinRequestService.approveRequest(userId, requestId));
    }

    // POST /club-join-requests/{requestId}/reject — owner/mod rejects
    @PostMapping("/{requestId}/reject")
    public ResponseEntity<Void> rejectRequest(
            @PathVariable Long requestId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        clubJoinRequestService.rejectRequest(userId, requestId);
        return ResponseEntity.noContent().build();
    }

    // GET /club-join-requests/club/{clubId}/pending — pending requests for a club (owner/mod only)
    @GetMapping("/club/{clubId}/pending")
    public ResponseEntity<List<ClubJoinRequestDto.Response>> getPendingRequests(
            @PathVariable Long clubId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(clubJoinRequestService.getPendingRequestsForClub(userId, clubId));
    }

    // GET /club-join-requests/my/{clubId} — the current user's request for a club (404 if none)
    @GetMapping("/my/{clubId}")
    public ResponseEntity<ClubJoinRequestDto.Response> getMyRequest(
            @PathVariable Long clubId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return clubJoinRequestService.getMyRequestForClub(userId, clubId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

}
