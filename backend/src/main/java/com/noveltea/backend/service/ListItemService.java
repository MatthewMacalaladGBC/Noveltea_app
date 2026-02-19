package com.noveltea.backend.service;

import com.noveltea.backend.exception.DuplicateResourceException;
import com.noveltea.backend.exception.ForbiddenException;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.Book;
import com.noveltea.backend.model.BookList;
import com.noveltea.backend.model.ListItem;
import com.noveltea.backend.dto.ListItemDto;
import com.noveltea.backend.repository.BookListRepository;
import com.noveltea.backend.repository.ListItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListItemService {

    private final BookListRepository bookListRepository;
    private final ListItemRepository listItemRepository;
    private final BookService bookService;

    // ----- CORE OPERATIONS -----

    /**
     * Adds a book to a list owned by the authenticated user.
     * Ensures the book exists in the local db (creates it if not).
     * Auto-assigns sortOrder to the next available position.
     */
    @Transactional
    public ListItemDto.Response addItem(Long userId, ListItemDto.Request request) {
        BookList bookList = bookListRepository.findById(request.getListId())
                .orElseThrow(() -> new ResourceNotFoundException("Book list not found: " + request.getListId()));

        // Ownership check (only the list creator can add items)
        if (!bookList.getCreator().getUserId().equals(userId)) {
            throw new ForbiddenException("Not authorized to add items to this list");
        }

        // Ensure the book exists in the local db (cache from Open Library metadata)
        // If doesn't already exist, ensureBookExists will add it automatically
        Book book = bookService.ensureBookExists(
                request.getBookId(),
                request.getTitle(),
                request.getAuthor(),
                request.getCoverImageUrl(),
                null
        );

        // Check if this book is already in the list (unique constraint would catch this too, but cleaner error)
        if (listItemRepository.existsByBookListAndBook(bookList, book)) {
            throw new DuplicateResourceException("Book is already in this list");
        }

        // Auto-assign sortOrder: max existing + 1, or 1 if list is still empty
        int sortOrder = listItemRepository.findTopByBookListOrderBySortOrderDesc(bookList)
                .map(item -> item.getSortOrder() + 1)
                .orElse(1);

        ListItem listItem = ListItem.builder()
                .book(book)
                .bookList(bookList)
                .sortOrder(sortOrder)
                .build();

        return mapToResponse(listItemRepository.save(listItem));
    }

    /**
     * Removes a book from a list. Only the list creator can remove items.
     */
    @Transactional
    public void removeItem(Long userId, Long listItemId) {
        ListItem item = listItemRepository.findById(listItemId)
                .orElseThrow(() -> new ResourceNotFoundException("List item not found: " + listItemId));

        if (!item.getBookList().getCreator().getUserId().equals(userId)) {
            throw new ForbiddenException("Not authorized to remove items from this list");
        }

        listItemRepository.delete(item);
    }

    // ----- READ OPERATIONS -----

    /**
     * Returns all items in a list, ordered by sortOrder.
     * Respects list visibility — private lists only viewable by their creator.
     */
    @Transactional(readOnly = true)
    public List<ListItemDto.Response> getItemsByList(Long requestingUserId, Long listId) {
        BookList bookList = bookListRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("Book list not found: " + listId));

        // Private lists are only viewable by their creator
        if (!bookList.getVisibility() && !bookList.getCreator().getUserId().equals(requestingUserId)) {
            throw new ForbiddenException("Not authorized to view this list");
        }

        return listItemRepository.findByBookListOrderBySortOrder(bookList).stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ----- SORT ORDER MANAGEMENT -----

    /**
     * Moves an item to a new position within its list.
     * Shifts other items up or down to accommodate.
     * Only the list creator can reorder.
     */
    @Transactional
    public void reorderItem(Long userId, Long listItemId, Integer newSortOrder) {
        ListItem item = listItemRepository.findById(listItemId)
                .orElseThrow(() -> new ResourceNotFoundException("List item not found: " + listItemId));

        if (!item.getBookList().getCreator().getUserId().equals(userId)) {
            throw new ForbiddenException("Not authorized to reorder items in this list");
        }

        int oldSortOrder = item.getSortOrder();
        if (oldSortOrder == newSortOrder) return;

        List<ListItem> allItems = listItemRepository.findByBookListOrderBySortOrder(item.getBookList());

        if (oldSortOrder < newSortOrder) {
            // Moving down: shift items between old+1 and new up by 1
            for (ListItem other : allItems) {
                int pos = other.getSortOrder();
                if (pos > oldSortOrder && pos <= newSortOrder) {
                    other.setSortOrder(pos - 1);
                }
            }
        } else {
            // Moving up: shift items between new and old-1 down by 1
            for (ListItem other : allItems) {
                int pos = other.getSortOrder();
                if (pos >= newSortOrder && pos < oldSortOrder) {
                    other.setSortOrder(pos + 1);
                }
            }
        }

        item.setSortOrder(newSortOrder);
        listItemRepository.saveAll(allItems);
    }

    // ----- DTO MAPPING -----

    private ListItemDto.Response mapToResponse(ListItem item) {
        return ListItemDto.Response.builder()
                .listItemId(item.getListItemId())
                .listId(item.getBookList().getListId())
                .bookId(item.getBook().getBookId())
                .bookTitle(item.getBook().getTitle())
                .bookAuthor(item.getBook().getAuthor())
                .coverImageUrl(item.getBook().getCoverImageUrl())
                .sortOrder(item.getSortOrder())
                .addedDate(item.getAddedDate())
                .build();
    }

}
