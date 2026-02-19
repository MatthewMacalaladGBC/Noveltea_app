package com.noveltea.backend.service;

import com.noveltea.backend.dto.BookClubMemberDto;
import com.noveltea.backend.exception.DuplicateResourceException;
import com.noveltea.backend.exception.ForbiddenException;
import com.noveltea.backend.exception.InvalidRequestException;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.BookClub;
import com.noveltea.backend.model.BookClubMember;
import com.noveltea.backend.model.BookClubMemberRole;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.BookClubMemberRepository;
import com.noveltea.backend.repository.BookClubRepository;
import com.noveltea.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookClubMemberService {

    private final BookClubMemberRepository bookClubMemberRepository;
    private final BookClubRepository bookClubRepository;
    private final UserRepository userRepository;

    // ----- CORE OPERATIONS -----

    /**
     * Allows the user to join a public club as a regular MEMBER.
     * Private clubs cannot be self-joined; the club Owner or Moderator must add members directly. (IMPLEMENT LATER?)
     */
    @Transactional
    public BookClubMemberDto.Response joinClub(Long userId, BookClubMemberDto.JoinRequest request) {
        BookClub bookClub = bookClubRepository.findById(request.getBookClubId())
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + request.getBookClubId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (bookClub.getPrivacy().equals(true)) {
            throw new ForbiddenException("Cannot self-join a private club.");
        }

        if (bookClubMemberRepository.existsByUserAndBookClub(user, bookClub)) {
            throw new DuplicateResourceException("User is already a member of this club.");
        }

        BookClubMember member = BookClubMember.builder()
                .user(user)
                .bookClub(bookClub)
                .role(BookClubMemberRole.MEMBER)
                .build();

        return mapToResponse(bookClubMemberRepository.save(member));
    }

    /**
     * Removes the user from a club.
     * The club OWNER cannot leave without first transferring ownership via updateRole.
     */
    @Transactional
    public void leaveClub(Long userId, Long bookClubId) {
        BookClub bookClub = bookClubRepository.findById(bookClubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + bookClubId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        BookClubMember member = bookClubMemberRepository.findByUserAndBookClub(user, bookClub)
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this club."));

        if (member.getRole() == BookClubMemberRole.OWNER) {
            throw new InvalidRequestException("Club owner cannot leave. Transfer ownership to another member first.");
        }

        bookClubMemberRepository.delete(member);
    }

    /**
     * Owner or Moderator removes a target member from a club.
     * The Owner cannot be removed. Moderators cannot remove other Moderators.
     */
    @Transactional
    public void removeMember(Long requestingUserId, Long bookClubId, Long targetUserId) {
        BookClub bookClub = bookClubRepository.findById(bookClubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + bookClubId));

        User requester = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requestingUserId));

        BookClubMember requesterMember = bookClubMemberRepository.findByUserAndBookClub(requester, bookClub)
                .orElseThrow(() -> new ForbiddenException("Requesting user is not a member of this club."));

        if (requesterMember.getRole() == BookClubMemberRole.MEMBER) {
            throw new ForbiddenException("Not authorized to remove members from this club.");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found: " + targetUserId));

        BookClubMember targetMember = bookClubMemberRepository.findByUserAndBookClub(target, bookClub)
                .orElseThrow(() -> new ResourceNotFoundException("Target user is not a member of this club."));

        if (targetMember.getRole() == BookClubMemberRole.OWNER) {
            throw new ForbiddenException("Cannot remove the club owner.");
        }

        // Moderators can only remove regular Members, not other Moderators
        if (requesterMember.getRole() == BookClubMemberRole.MODERATOR && targetMember.getRole() == BookClubMemberRole.MODERATOR) {
            throw new ForbiddenException("Moderators cannot remove other moderators.");
        }

        bookClubMemberRepository.delete(targetMember);
    }

    /**
     * Updates a member's role within the club. Only the Owner can change roles.
     * Assigning OWNER to another member transfers ownership (the current OWNER becomes MODERATOR).
     * The Owner cannot (directly) update their own role via this method.
     */
    @Transactional
    public BookClubMemberDto.Response updateRole(Long requestingUserId, Long bookClubId, BookClubMemberDto.UpdateRoleRequest request) {
        BookClub bookClub = bookClubRepository.findById(bookClubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + bookClubId));

        User requester = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requestingUserId));

        BookClubMember requesterMember = bookClubMemberRepository.findByUserAndBookClub(requester, bookClub)
                .orElseThrow(() -> new ForbiddenException("Requesting user is not a member of this club."));

        if (requesterMember.getRole() != BookClubMemberRole.OWNER) {
            throw new ForbiddenException("Only the club owner can update member roles.");
        }

        if (requestingUserId.equals(request.getUserId())) {
            throw new InvalidRequestException("Cannot update your own role. To transfer ownership, assign it to another member.");
        }

        User target = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found: " + request.getUserId()));

        BookClubMember targetMember = bookClubMemberRepository.findByUserAndBookClub(target, bookClub)
                .orElseThrow(() -> new ResourceNotFoundException("Target user is not a member of this club."));

        // Ownership transfer: current owner steps down to MODERATOR, target becomes OWNER
        if (request.getRole() == BookClubMemberRole.OWNER) {
            requesterMember.setRole(BookClubMemberRole.MODERATOR);
            bookClubMemberRepository.save(requesterMember);
        }

        targetMember.setRole(request.getRole());
        return mapToResponse(bookClubMemberRepository.save(targetMember));
    }

    // ----- READ OPERATIONS -----

    /**
     * Returns all members of a club.
     * Only club members can view a private club's member list.
     */
    @Transactional(readOnly = true)
    public List<BookClubMemberDto.Response> getMembersByClub(Long userId, Long bookClubId) {
        BookClub bookClub = bookClubRepository.findById(bookClubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + bookClubId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (bookClub.getPrivacy().equals(true) && !bookClubMemberRepository.existsByUserAndBookClub(user, bookClub)) {
            throw new ForbiddenException("User is not a member of this club.");
        }

        return bookClubMemberRepository.findByBookClub(bookClub).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Returns all club memberships for the authenticated user.
     */
    @Transactional(readOnly = true)
    public List<BookClubMemberDto.Response> getMembershipsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        return bookClubMemberRepository.findByUser(user).stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ----- DTO MAPPING -----

    private BookClubMemberDto.Response mapToResponse(BookClubMember member) {
        return BookClubMemberDto.Response.builder()
                .clubMemberId(member.getClubMemberId())
                .bookClubId(member.getBookClub().getBookClubId())
                .clubName(member.getBookClub().getName())
                .userId(member.getUser().getUserId())
                .username(member.getUser().getUsername())
                .role(member.getRole())
                .joinedDate(member.getJoinedDate())
                .build();
    }

}