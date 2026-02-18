package com.noveltea.backend.repository;

import com.noveltea.backend.model.Book;
import com.noveltea.backend.model.BookClub;
import com.noveltea.backend.model.BookClubItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookClubItemRepository extends JpaRepository<BookClubItem, Long> {

    // All items in a club (all statuses)
    List<BookClubItem> findByBookClub(BookClub bookClub);

    // Items filtered by status (e.g. "Active", "Upcoming", "Completed")
    // Service enforces only one Active item at a time
    List<BookClubItem> findByBookClubAndStatus(BookClub bookClub, String status);

    // Check if a book already exists in a club before adding
    boolean existsByBookClubAndBook(BookClub bookClub, Book book);

    // Retrieve specific entry (for updates or removal)
    Optional<BookClubItem> findByBookClubAndBook(BookClub bookClub, Book book);

}