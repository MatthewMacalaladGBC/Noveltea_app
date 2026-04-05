package com.noveltea.backend.repository;

import com.noveltea.backend.model.BookClub;
import com.noveltea.backend.model.ClubJoinRequest;
import com.noveltea.backend.model.ClubJoinRequestStatus;
import com.noveltea.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubJoinRequestRepository extends JpaRepository<ClubJoinRequest, Long> {

    // All pending requests for a club (for owner/mod approval panel)
    List<ClubJoinRequest> findByBookClubAndStatus(BookClub bookClub, ClubJoinRequestStatus status);

    // User's most recent request for a specific club (any status)
    Optional<ClubJoinRequest> findTopByUserAndBookClubOrderByRequestedAtDesc(User user, BookClub bookClub);

    // Check if a pending request already exists for this user+club
    boolean existsByUserAndBookClubAndStatus(User user, BookClub bookClub, ClubJoinRequestStatus status);

}
