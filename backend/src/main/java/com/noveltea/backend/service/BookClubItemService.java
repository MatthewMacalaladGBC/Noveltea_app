package com.noveltea.backend.service;

import com.noveltea.backend.dto.BookClubItemDto;
import com.noveltea.backend.model.Book;
import com.noveltea.backend.exception.DuplicateResourceException;
import com.noveltea.backend.exception.ForbiddenException;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.BookClub;
import com.noveltea.backend.model.BookClubItem;
import com.noveltea.backend.model.BookClubItemStatus;
import com.noveltea.backend.model.BookClubMember;
import com.noveltea.backend.model.BookClubMemberRole;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.BookClubItemRepository;
import com.noveltea.backend.repository.BookClubMemberRepository;
import com.noveltea.backend.repository.BookClubRepository;
import com.noveltea.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookClubItemService {

    private final BookClubItemRepository bookClubItemRepository;
    private final BookClubRepository bookClubRepository;
    private final BookClubMemberRepository bookClubMemberRepository;
    private final UserRepository userRepository;
    private final BookService bookService;

    // ----- CORE OPERATIONS -----

    /**
     * Adds a book to a club owned or moderated by the authenticated user.
     * Ensures the book exists in the local db (creates it if not).
     * Always adds as UPCOMING; use updateItem to transition to ACTIVE.
     */
    @Transactional
    public BookClubItemDto.Response addBook(Long userId, BookClubItemDto.AddRequest request) {
        BookClub bookClub = bookClubRepository.findById(request.getBookClubId())
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + request.getBookClubId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        BookClubMember bookClubMember = bookClubMemberRepository.findByUserAndBookClub(user, bookClub)
                .orElseThrow(() -> new ForbiddenException("User is not a member of the club: " + userId));

        // Member role check (only a club owner or moderator can add a book)
        if (bookClubMember.getRole() == BookClubMemberRole.MEMBER) {
            throw new ForbiddenException("Not authorized to add items to this club.");
        }

        // Ensure the book exists in the local db (cache from Open Library metadata)
        Book book = bookService.ensureBookExists(
                request.getBookId(),
                request.getTitle(),
                request.getAuthor(),
                request.getCoverImageUrl(),
                null
        );

        // Check if this book is already in the club (unique constraint would catch this too, but cleaner error)
        if (bookClubItemRepository.existsByBookClubAndBook(bookClub, book)) {
            throw new DuplicateResourceException("Book is already a part of this club.");
        }

        BookClubItem bookClubItem = BookClubItem.builder()
                .book(book)
                .bookClub(bookClub)
                .build();

        return mapToResponse(bookClubItemRepository.save(bookClubItem));
    }

    /**
     * Updates status and/or reading dates for a club item.
     * Transitioning to ACTIVE auto-completes any currently active item and sets startDate to today if not provided.
     * Only a club owner / moderator can update items.
     */
    @Transactional
    public BookClubItemDto.Response updateItem(Long userId, Long clubItemId, BookClubItemDto.UpdateRequest request) {
        BookClubItem bookClubItem = bookClubItemRepository.findById(clubItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Club Item not found: " + clubItemId));

        BookClub bookClub = bookClubRepository.findById(bookClubItem.getBookClub().getBookClubId())
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        BookClubMember bookClubMember = bookClubMemberRepository.findByUserAndBookClub(user, bookClub)
                .orElseThrow(() -> new ForbiddenException("User is not a member of the club: " + userId));

        // Role check (only a club owner or moderator can modify a club item)
        if (bookClubMember.getRole() == BookClubMemberRole.MEMBER) {
            throw new ForbiddenException("Not authorized to modify items in this club.");
        }

        if (request.getStatus() != null) {
            if (request.getStatus() == BookClubItemStatus.ACTIVE) {
                // Auto-complete the currently active item (if any)
                bookClubItemRepository.findFirstByBookClubAndStatus(bookClub, BookClubItemStatus.ACTIVE)
                        .ifPresent(current -> {
                            current.setStatus(BookClubItemStatus.COMPLETED);
                            bookClubItemRepository.save(current);
                        });
                // Auto-set startDate if not explicitly provided
                bookClubItem.setStartDate(
                        request.getStartDate() != null ? request.getStartDate() : LocalDate.now()
                );
            }
            bookClubItem.setStatus(request.getStatus());
        }

        // Apply explicit date updates (startDate already handled above when transitioning to ACTIVE)
        if (request.getStartDate() != null) {
            bookClubItem.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            bookClubItem.setEndDate(request.getEndDate());
        }

        return mapToResponse(bookClubItemRepository.save(bookClubItem));
    }

    /**
     * Removes a book from a club. Only a club owner / moderator can remove items.
     */
    @Transactional
    public void removeBook(Long userId, Long clubItemId) {
        BookClubItem bookClubItem = bookClubItemRepository.findById(clubItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Club Item not found: " + clubItemId));

        BookClub bookClub = bookClubRepository.findById(bookClubItem.getBookClub().getBookClubId())
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        BookClubMember bookClubMember = bookClubMemberRepository.findByUserAndBookClub(user, bookClub)
                .orElseThrow(() -> new ForbiddenException("User is not a member of the club: " + userId));

        // Role check (only a club owner or moderator can remove a club item)
        if (bookClubMember.getRole() == BookClubMemberRole.MEMBER) {
            throw new ForbiddenException("Not authorized to remove items from this club.");
        }

        bookClubItemRepository.delete(bookClubItem);
    }

    // ----- READ OPERATIONS -----

    /**
     * Returns all items in a club across all statuses.
     * Respects club visibility (private clubs only viewable by their members).
     */
    @Transactional(readOnly = true)
    public List<BookClubItemDto.Response> getItemsByClub(Long userId, Long bookClubId) {
        BookClub bookClub = bookClubRepository.findById(bookClubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + bookClubId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (bookClub.getPrivacy().equals(true) && !bookClubMemberRepository.existsByUserAndBookClub(user, bookClub)) {
            throw new ForbiddenException("User is not a member of the club: " + userId);
        }

        return bookClubItemRepository.findByBookClub(bookClub).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Returns all items in a club with a given status (UPCOMING, ACTIVE, or COMPLETED).
     * Respects club visibility (private clubs only viewable by their members).
     */
    @Transactional(readOnly = true)
    public List<BookClubItemDto.Response> getItemsByStatus(Long userId, Long bookClubId, BookClubItemStatus status) {
        BookClub bookClub = bookClubRepository.findById(bookClubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + bookClubId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (bookClub.getPrivacy().equals(true) && !bookClubMemberRepository.existsByUserAndBookClub(user, bookClub)) {
            throw new ForbiddenException("User is not a member of the club: " + userId);
        }

        return bookClubItemRepository.findByBookClubAndStatus(bookClub, status).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Returns the currently-active item in a club.
     * Respects club visibility (private clubs only viewable by their members).
     */
    @Transactional(readOnly = true)
    public BookClubItemDto.Response getCurrentRead(Long userId, Long bookClubId) {
        BookClub bookClub = bookClubRepository.findById(bookClubId)
                .orElseThrow(() -> new ResourceNotFoundException("Book Club not found: " + bookClubId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (bookClub.getPrivacy().equals(true) && !bookClubMemberRepository.existsByUserAndBookClub(user, bookClub)) {
            throw new ForbiddenException("User is not a member of the club: " + userId);
        }

        return bookClubItemRepository.findFirstByBookClubAndStatus(bookClub, BookClubItemStatus.ACTIVE)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("No currently active book in the club."));
    }

    // ----- DTO MAPPING -----

    private BookClubItemDto.Response mapToResponse(BookClubItem bookClubItem) {
        return BookClubItemDto.Response.builder()
                .clubItemId(bookClubItem.getClubItemId())
                .bookClubId(bookClubItem.getBookClub().getBookClubId())
                .bookId(bookClubItem.getBook().getBookId())
                .bookTitle(bookClubItem.getBook().getTitle())
                .bookAuthor(bookClubItem.getBook().getAuthor())
                .coverImageUrl(bookClubItem.getBook().getCoverImageUrl())
                .status(bookClubItem.getStatus())
                .startDate(bookClubItem.getStartDate())
                .endDate(bookClubItem.getEndDate())
                .addedDate(bookClubItem.getAddedDate())
                .build();
    }

}
