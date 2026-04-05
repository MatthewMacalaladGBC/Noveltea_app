package com.noveltea.backend.repository;

import com.noveltea.backend.model.BookClub;
import com.noveltea.backend.model.ClubPoll;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClubPollRepository extends JpaRepository<ClubPoll, Long> {
    Optional<ClubPoll> findFirstByBookClubAndActiveTrue(BookClub bookClub);
    List<ClubPoll> findByBookClubAndActiveTrue(BookClub bookClub);
}
