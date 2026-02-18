package com.noveltea.backend.repository;

import com.noveltea.backend.model.Book;
import com.noveltea.backend.model.BookList;
import com.noveltea.backend.model.ListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListItemRepository extends JpaRepository<ListItem, Long> {

    // All books in a list, ordered by their sort position
    List<ListItem> findByBookListOrderBySortOrder(BookList bookList);

    // Check if a book is already in a list before adding
    boolean existsByBookListAndBook(BookList bookList, Book book);

    // Retrieve specific entry (used for removal or reordering)
    Optional<ListItem> findByBookListAndBook(BookList bookList, Book book);

    // Get the item with the highest sortOrder (used for assigning position of next added)
    Optional<ListItem> findTopByBookListOrderBySortOrderDesc(BookList bookList);

    // Total number of books in a list
    long countByBookList(BookList bookList);

}
