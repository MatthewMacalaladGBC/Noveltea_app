package com.noveltea.backend.repository;

import com.noveltea.backend.model.BookList;
import com.noveltea.backend.model.BookListFollower;
import com.noveltea.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookListFollowerRepository extends JpaRepository<BookListFollower, Long> {

    // All lists a user is following
    List<BookListFollower> findByUser(User user);

    // All followers of a given list
    List<BookListFollower> findByBookList(BookList bookList);

    // Check if user already follows a list (before following)
    boolean existsByUserAndBookList(User user, BookList bookList);

    // Retrieve specific relationship (needed to get the ID for deletion (unfollow))
    Optional<BookListFollower> findByUserAndBookList(User user, BookList bookList);

    // Total follower count for a list
    long countByBookList(BookList bookList);

}