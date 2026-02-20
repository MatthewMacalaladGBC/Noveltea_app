package com.noveltea.backend.service;

import com.noveltea.backend.dto.BookListDto;
import com.noveltea.backend.exception.ForbiddenException;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.BookList;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.BookListRepository;
import com.noveltea.backend.repository.ListItemRepository;
import com.noveltea.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookListService {

    private final BookListRepository bookListRepository;
    private final ListItemRepository listItemRepository;
    private final UserRepository userRepository;

    // ----- CORE OPERATIONS -----

    /**
     * Creates a new book list owned by the authenticated user.
     * Defaults visibility to public (true) if not provided.
     */
    @Transactional
    public BookListDto.Response createList(Long userId, BookListDto.CreateRequest request) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        BookList list = BookList.builder()
                .creator(creator)
                .title(request.getTitle())
                .description(request.getDescription())
                .build();

        // Only override the default (true) if explicitly provided
        if (request.getVisibility() != null) {
            list.setVisibility(request.getVisibility());
        }

        return mapToResponse(bookListRepository.save(list));
    }

    /**
     * Updates an existing book list. Only the creator can update.
     * Partial update: only non-null fields in the request are applied.
     */
    @Transactional
    public BookListDto.Response updateList(Long userId, Long listId, BookListDto.UpdateRequest request) {
        BookList list = bookListRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found: " + listId));

        // Ownership check (only the creator can modify their list)
        // Extra check, will likely not even show option for updating a list to users that did not create it
        if (!list.getCreator().getUserId().equals(userId)) {
            throw new ForbiddenException("Not authorized to update this list");
        }

        if (request.getTitle() != null) {
            list.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            list.setDescription(request.getDescription());
        }
        if (request.getVisibility() != null) {
            list.setVisibility(request.getVisibility());
        }

        return mapToResponse(bookListRepository.save(list));
    }

    /**
     * Deletes a book list. Only the creator can delete.
     * The "Library" list is system-managed and cannot be deleted by anyone.
     * Associated ListItems and BookListFollowers are cleaned up by ON DELETE CASCADE.
     */
    @Transactional
    public void deleteList(Long userId, Long listId) {
        BookList list = bookListRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found: " + listId));

        if ("Library".equals(list.getTitle())) {
            throw new ForbiddenException("The Library list cannot be deleted");
        }

        if (!list.getCreator().getUserId().equals(userId)) {
            throw new ForbiddenException("Not authorized to delete this list");
        }

        bookListRepository.delete(list);
    }

    // ----- READ OPERATIONS -----

    /**
     * Returns a single list by ID.
     * If the list is private, only the creator can view it.
     */
    @Transactional(readOnly = true)
    public BookListDto.Response getListById(Long requestingUserId, Long listId) {
        BookList list = bookListRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found: " + listId));

        // Private lists are only visible to their creator
        if (!list.getVisibility() && !list.getCreator().getUserId().equals(requestingUserId)) {
            throw new ForbiddenException("Not authorized to view this list");
        }

        return mapToResponse(list);
    }

    /**
     * Returns lists created by a specific user.
     * If the requesting user is the owner, returns all lists (including private).
     * Otherwise, returns only their public lists.
     */
    @Transactional(readOnly = true)
    public List<BookListDto.Response> getListsByUser(Long requestingUserId, Long targetUserId) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        List<BookList> lists;
        if (requestingUserId.equals(targetUserId)) {
            // Viewing own profile (show all lists)
            lists = bookListRepository.findByCreator(targetUser);
        } else {
            // Viewing another user's profile (show only public lists)
            lists = bookListRepository.findByCreatorAndVisibilityTrue(targetUser);
        }

        return lists.stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Searches public lists by partial title match (case-insensitive).
     * Used on the explore / discover screen (TO BE IMPLEMENTED).
     */
    @Transactional(readOnly = true)
    public List<BookListDto.Response> searchPublicLists(String title) {
        return bookListRepository.findByVisibilityTrueAndTitleContainingIgnoreCase(title).stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ----- DTO MAPPING -----

    private BookListDto.Response mapToResponse(BookList list) {
        return BookListDto.Response.builder()
                .listId(list.getListId())
                .creatorId(list.getCreator().getUserId())
                .creatorUsername(list.getCreator().getUsername())
                .title(list.getTitle())
                .description(list.getDescription())
                .visibility(list.getVisibility())
                .creationDate(list.getCreationDate())
                .bookCount(listItemRepository.countByListId(list.getListId()))
                .build();
    }

}