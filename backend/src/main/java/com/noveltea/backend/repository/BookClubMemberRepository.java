package com.noveltea.backend.repository;

import com.noveltea.backend.model.BookClub;
import com.noveltea.backend.model.BookClubMember;
import com.noveltea.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookClubMemberRepository extends JpaRepository<BookClubMember, Long> {

    // All members of a club
    List<BookClubMember> findByBookClub(BookClub bookClub);

    // All clubs a user belongs to
    List<BookClubMember> findByUser(User user);

    // Check if a user is already a member before adding
    boolean existsByUserAndBookClub(User user, BookClub bookClub);

    // Retrieve specific membership (used for role checks, role updates, and removal)
    Optional<BookClubMember> findByUserAndBookClub(User user, BookClub bookClub);

    // Members filtered by role (e.g. find "Owner" to identify creator)
    List<BookClubMember> findByBookClubAndRole(BookClub bookClub, String role);

    // Total member count for a club
    long countByBookClub(BookClub bookClub);

}