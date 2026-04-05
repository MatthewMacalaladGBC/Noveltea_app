package com.noveltea.backend.service;

import com.noveltea.backend.dto.BookClubMemberDto;
import com.noveltea.backend.dto.ClubJoinRequestDto;
import com.noveltea.backend.exception.DuplicateResourceException;
import com.noveltea.backend.exception.ForbiddenException;
import com.noveltea.backend.exception.InvalidRequestException;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.*;
import com.noveltea.backend.repository.BookClubMemberRepository;
import com.noveltea.backend.repository.BookClubRepository;
import com.noveltea.backend.repository.ClubJoinRequestRepository;
import com.noveltea.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClubJoinRequestService {

    private final ClubJoinRequestRepository joinRequestRepository;
    private final BookClubRepository bookClubRepository;
    private final BookClubMemberRepository bookClubMemberRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    /**
     * Creates a join request for a private club.
     * Only valid for private clubs — public clubs can be joined directly.
     */
    @Transactional
    public ClubJoinRequestDto.Response requestJoin(Long userId, ClubJoinRequestDto.CreateRequest request) {
        BookClub bookClub = bookClubRepository.findById(request.getBookClubId())
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + request.getBookClubId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!bookClub.getPrivacy()) {
            throw new InvalidRequestException("This club is public — use the join endpoint instead.");
        }

        if (bookClubMemberRepository.existsByUserAndBookClub(user, bookClub)) {
            throw new DuplicateResourceException("You are already a member of this club.");
        }

        if (joinRequestRepository.existsByUserAndBookClubAndStatus(user, bookClub, ClubJoinRequestStatus.PENDING)) {
            throw new DuplicateResourceException("You already have a pending join request for this club.");
        }

        ClubJoinRequest joinRequest = ClubJoinRequest.builder()
                .user(user)
                .bookClub(bookClub)
                .status(ClubJoinRequestStatus.PENDING)
                .build();

        ClubJoinRequest saved = joinRequestRepository.save(joinRequest);
        gamificationService.updateDailyStreak(userId);
        return mapToResponse(saved);    }

    /**
     * Cancels the user's own pending join request.
     */
    @Transactional
    public void cancelRequest(Long userId, Long requestId) {
        ClubJoinRequest joinRequest = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found: " + requestId));

        if (!joinRequest.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("You can only cancel your own join request.");
        }

        if (joinRequest.getStatus() != ClubJoinRequestStatus.PENDING) {
            throw new InvalidRequestException("Only pending requests can be cancelled.");
        }

        joinRequestRepository.delete(joinRequest);
    }

    /**
     * Owner or moderator approves a pending join request, creating a MEMBER membership.
     */
    @Transactional
    public BookClubMemberDto.Response approveRequest(Long requestingUserId, Long requestId) {
        ClubJoinRequest joinRequest = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found: " + requestId));

        if (joinRequest.getStatus() != ClubJoinRequestStatus.PENDING) {
            throw new InvalidRequestException("This request has already been " + joinRequest.getStatus().name().toLowerCase() + ".");
        }

        BookClub bookClub = joinRequest.getBookClub();
        User requester = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requestingUserId));

        BookClubMember requesterMember = bookClubMemberRepository.findByUserAndBookClub(requester, bookClub)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this club."));

        if (requesterMember.getRole() == BookClubMemberRole.MEMBER) {
            throw new ForbiddenException("Only owners and moderators can approve join requests.");
        }

        joinRequest.setStatus(ClubJoinRequestStatus.APPROVED);
        joinRequestRepository.save(joinRequest);

        BookClubMember newMember = BookClubMember.builder()
                .user(joinRequest.getUser())
                .bookClub(bookClub)
                .role(BookClubMemberRole.MEMBER)
                .build();

        BookClubMember saved = bookClubMemberRepository.save(newMember);
        gamificationService.updateDailyStreak(requestingUserId);

        return BookClubMemberDto.Response.builder()
                .clubMemberId(saved.getClubMemberId())
                .bookClubId(bookClub.getBookClubId())
                .clubName(bookClub.getName())
                .userId(saved.getUser().getUserId())
                .username(saved.getUser().getUsername())
                .role(saved.getRole())
                .joinedDate(saved.getJoinedDate())
                .build();
    }

    /**
     * Owner or moderator rejects a pending join request.
     */
    @Transactional
    public void rejectRequest(Long requestingUserId, Long requestId) {
        ClubJoinRequest joinRequest = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found: " + requestId));

        if (joinRequest.getStatus() != ClubJoinRequestStatus.PENDING) {
            throw new InvalidRequestException("This request has already been " + joinRequest.getStatus().name().toLowerCase() + ".");
        }

        BookClub bookClub = joinRequest.getBookClub();
        User requester = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requestingUserId));

        BookClubMember requesterMember = bookClubMemberRepository.findByUserAndBookClub(requester, bookClub)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this club."));

        if (requesterMember.getRole() == BookClubMemberRole.MEMBER) {
            throw new ForbiddenException("Only owners and moderators can reject join requests.");
        }

        joinRequest.setStatus(ClubJoinRequestStatus.REJECTED);
        joinRequestRepository.save(joinRequest);
        
        gamificationService.updateDailyStreak(requestingUserId);
    }

    /**
     * Returns all pending join requests for a club. Only accessible by owner/moderator.
     */
    @Transactional(readOnly = true)
    public List<ClubJoinRequestDto.Response> getPendingRequestsForClub(Long requestingUserId, Long clubId) {
        BookClub bookClub = bookClubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + clubId));

        User requester = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requestingUserId));

        BookClubMember requesterMember = bookClubMemberRepository.findByUserAndBookClub(requester, bookClub)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this club."));

        if (requesterMember.getRole() == BookClubMemberRole.MEMBER) {
            throw new ForbiddenException("Only owners and moderators can view join requests.");
        }

        return joinRequestRepository.findByBookClubAndStatus(bookClub, ClubJoinRequestStatus.PENDING).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Returns the current user's most recent join request for a specific club, or empty if none.
     */
    @Transactional(readOnly = true)
    public Optional<ClubJoinRequestDto.Response> getMyRequestForClub(Long userId, Long clubId) {
        BookClub bookClub = bookClubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + clubId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        return joinRequestRepository.findTopByUserAndBookClubOrderByRequestedAtDesc(user, bookClub)
                .map(this::mapToResponse);
    }

    // ----- DTO MAPPING -----

    private ClubJoinRequestDto.Response mapToResponse(ClubJoinRequest req) {
        return ClubJoinRequestDto.Response.builder()
                .requestId(req.getRequestId())
                .bookClubId(req.getBookClub().getBookClubId())
                .clubName(req.getBookClub().getName())
                .userId(req.getUser().getUserId())
                .username(req.getUser().getUsername())
                .status(req.getStatus())
                .requestedAt(req.getRequestedAt())
                .build();
    }

}
