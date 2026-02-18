package com.noveltea.backend.repository;

import com.noveltea.backend.model.BookClub;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookClubRepository extends JpaRepository<BookClub, Long> {

    // Check that name is unique before creating a club
    boolean existsByName(String name);

    // All public clubs (privacy = false means public; for discovery / browse)
    List<BookClub> findByPrivacyFalse();

    // Search public clubs by name
    List<BookClub> findByPrivacyFalseAndNameContainingIgnoreCase(String name);

}
