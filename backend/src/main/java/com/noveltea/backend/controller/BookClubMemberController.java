package com.noveltea.backend.controller;

import com.noveltea.backend.dto.BookClubMemberDto;
import com.noveltea.backend.service.BookClubMemberService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/club-members")
@RequiredArgsConstructor
public class BookClubMemberController extends BaseController {

    private final BookClubMemberService bookClubMemberService;

    // POST /club-members/join  (logged in, public clubs only)
    @PostMapping("/join")
    public ResponseEntity<BookClubMemberDto.Response> joinClub(
            @Valid @RequestBody BookClubMemberDto.JoinRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookClubMemberService.joinClub(userId, request));
    }

    // DELETE /club-members/leave/{bookClubId}  (logged in)
    @DeleteMapping("/leave/{bookClubId}")
    public ResponseEntity<Void> leaveClub(
            @PathVariable Long bookClubId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        bookClubMemberService.leaveClub(userId, bookClubId);
        return ResponseEntity.noContent().build();
    }

    // DELETE /club-members/{bookClubId}/remove/{targetUserId}  (owner/mod only)
    @DeleteMapping("/{bookClubId}/remove/{targetUserId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long bookClubId,
            @PathVariable Long targetUserId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        bookClubMemberService.removeMember(userId, bookClubId, targetUserId);
        return ResponseEntity.noContent().build();
    }

    // PUT /club-members/{bookClubId}/role  (owner only)
    @PutMapping("/{bookClubId}/role")
    public ResponseEntity<BookClubMemberDto.Response> updateRole(
            @PathVariable Long bookClubId,
            @Valid @RequestBody BookClubMemberDto.UpdateRoleRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookClubMemberService.updateRole(userId, bookClubId, request));
    }

    // GET /club-members/club/{bookClubId}  (club members; private club requires membership)
    @GetMapping("/club/{bookClubId}")
    public ResponseEntity<List<BookClubMemberDto.Response>> getMembersByClub(
            @PathVariable Long bookClubId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookClubMemberService.getMembersByClub(userId, bookClubId));
    }

    // GET /club-members/me  (my memberships)
    @GetMapping("/me")
    public ResponseEntity<List<BookClubMemberDto.Response>> getMyMemberships(HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookClubMemberService.getMembershipsByUser(userId));
    }
}
