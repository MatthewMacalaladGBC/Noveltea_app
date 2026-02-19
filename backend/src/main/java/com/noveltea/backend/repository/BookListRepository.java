package com.noveltea.backend.repository;

import com.noveltea.backend.model.BookList;
import com.noveltea.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookListRepository extends JpaRepository<BookList, Long> {

    // All lists created by a user (for own profile view)
    List<BookList> findByCreator(User creator);

    // Public lists by a user (lists set to visible, to show other users on their profile)
    List<BookList> findByCreatorAndVisibilityTrue(User creator);

    // All public lists (for discovery / browse)
    List<BookList> findByVisibilityTrue();

    // Search all public lists by title
    List<BookList> findByVisibilityTrueAndTitleContainingIgnoreCase(String title);

}