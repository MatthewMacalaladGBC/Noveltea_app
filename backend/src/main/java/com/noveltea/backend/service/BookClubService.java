package com.noveltea.backend.service;

import com.noveltea.backend.dto.BookClubDto;
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
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookClubService {

    private final BookClubRepository bookClubRepository;
    private final BookClubMemberRepository bookClubMemberRepository;
    private final UserRepository userRepository;

    // ----- CORE OPERATIONS -----

    /**
     * Creates a new book club owned by the authenticated user.
     * Defaults privacy to public (false) if not provided.
     */
    @Transactional
    public BookClubDto.Response createClub(Long userId, BookClubDto.CreateRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Enforce one-owned-club-at-a-time rule
        if (bookClubMemberRepository.existsByUser_UserIdAndRole(userId, BookClubMemberRole.OWNER)) {
            throw new InvalidRequestException("You already own a book club. Delete it before creating a new one.");
        }

        BookClub bookClub = BookClub.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        // Only override the default (false / public) if explicitly provided
        if (request.getPrivacy() != null) {
            bookClub.setPrivacy(request.getPrivacy());
        }

        bookClub = bookClubRepository.save(bookClub);

        bookClubMemberRepository.save(
            BookClubMember.builder()
                .user(owner)
                .bookClub(bookClub)
                .role(BookClubMemberRole.OWNER)
                .build()
        );

        return mapToResponse(bookClub);
    }

    /**
     * Updates an existing book club. Only the owner and moderators can update.
     * Partial update: only non-null fields in the request are applied.
     */
    @Transactional
    public BookClubDto.Response updateClub(Long userId, Long bookClubId, BookClubDto.UpdateRequest request) {
        BookClub bookClub = bookClubRepository.findById(bookClubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + bookClubId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        BookClubMember bookClubMember = bookClubMemberRepository.findByUserAndBookClub(user, bookClub)
                .orElseThrow(() -> new ForbiddenException("User is not a member of this club."));

        // Ownership / Moderator check (only the owner and club mods can modify a club)
        // Extra check, will likely not even show option for updating a list to users that did not create it
        if (bookClubMember.getRole() == BookClubMemberRole.MEMBER) {
            throw new ForbiddenException("Only the owner and club moderators are authorized to update this club");
        }

        if (request.getName() != null) {
            bookClub.setName(request.getName());
        }
        if (request.getDescription() != null) {
            bookClub.setDescription(request.getDescription());
        }
        if (request.getPrivacy() != null) {
            bookClub.setPrivacy(request.getPrivacy());
        }

        return mapToResponse(bookClubRepository.save(bookClub));
    }

    /**
     * Deletes a book club. Only the owner can delete.
     * Associated BookClubItems and BookClubMembers are cleaned up by ON DELETE CASCADE.
     */
    @Transactional
    public void deleteClub(Long userId, Long bookClubId) {
        BookClub bookClub = bookClubRepository.findById(bookClubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + bookClubId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        BookClubMember bookClubMember = bookClubMemberRepository.findByUserAndBookClub(user, bookClub)
                .orElseThrow(() -> new ForbiddenException("User is not a member of this club."));

        if (bookClubMember.getRole() != BookClubMemberRole.OWNER) {
            throw new ForbiddenException("Only the owner can delete a club.");
        }

        bookClubRepository.delete(bookClub);
    }


    // ----- READ OPERATIONS -----

    /**
     * Returns a single club by ID.
     * If the club is private, only members can view it.
     */
    @Transactional(readOnly = true)
    public BookClubDto.Response getClubById(Long userId, Long bookClubId) {
        BookClub bookClub = bookClubRepository.findById(bookClubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + bookClubId));

        // Private clubs return basic info to all authenticated users (so they can request to join via search).
        // Content restriction (members list, items) is enforced at the respective endpoints.
        return mapToResponse(bookClub);
    }

    /**
     * Returns all public clubs.
     */
    @Transactional(readOnly = true)
    public List<BookClubDto.Response> getPublicClubs() {
        List<BookClub> publicClubs = bookClubRepository.findByPrivacyFalse();

        return publicClubs.stream()
            .map(this::mapToResponse)
            .toList();
    }

    /**
     * Searches public clubs by partial title match (case-insensitive).
     */
    @Transactional(readOnly = true)
    public List<BookClubDto.Response> searchPublicClubs(String name) {
        return bookClubRepository.findByPrivacyFalseAndNameContainingIgnoreCase(name).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Searches all clubs (public + private) by partial title match.
     * Used for authenticated search so users can find and request to join private clubs.
     */
    @Transactional(readOnly = true)
    public List<BookClubDto.Response> searchAllClubs(String name) {
        return bookClubRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Returns all clubs the authenticated user belongs to (any role).
     */
    @Transactional(readOnly = true)
    public List<BookClubDto.Response> getMyClubs(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        return bookClubMemberRepository.findByUser(user).stream()
                .map(member -> mapToResponse(member.getBookClub()))
                .toList();
    }

    // ----- DTO MAPPING -----

    private BookClubDto.Response mapToResponse(BookClub bookClub) {
        long memberCount = bookClubMemberRepository.countByBookClub(bookClub);
        String ownerUsername = bookClubMemberRepository
                .findByBookClubAndRole(bookClub, BookClubMemberRole.OWNER)
                .stream()
                .findFirst()
                .map(m -> m.getUser().getUsername())
                .orElse(null);

        return BookClubDto.Response.builder()
                .bookClubId(bookClub.getBookClubId())
                .name(bookClub.getName())
                .description(bookClub.getDescription())
                .privacy(bookClub.getPrivacy())
                .creationDate(bookClub.getCreationDate())
                .memberCount(memberCount)
                .ownerUsername(ownerUsername)
                .build();
    }

}