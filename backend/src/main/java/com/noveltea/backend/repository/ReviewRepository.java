package com.noveltea.backend.repository;

import com.noveltea.backend.model.Book;
import com.noveltea.backend.model.Review;
import com.noveltea.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // All reviews for a book (used to calculate the book's rating)
    List<Review> findByBook(Book book);

    // All reviews for a book by book ID (used by auth branch's ReviewService)
    List<Review> findByBook_BookId(String bookId);

    // Public reviews for a book (used for displaying reviews on book page)
    List<Review> findByBookAndVisibilityTrueAndReviewTextNotNull(Book book);

    // All reviews written by a user (own profile view, includes private)
    List<Review> findByUser(User user);

    // Public reviews by a user (visible on their profile to others)
    List<Review> findByUserAndVisibilityTrue(User user);

    // Check if a user has already reviewed a specific book
    boolean existsByUserAndBook(User user, Book book);

    // Total review count for a book (for display)
    long countByBook(Book book);


    List<Review> findByBook_BookIdAndVisibilityTrue(String bookId);
    List<Review> findByUser_UserIdAndBook_BookIdAndVisibilityFalse(Long userId, String bookId);

    // Total review count for a user (for profile stats)
    long countByUser_UserId(Long userId);

}
