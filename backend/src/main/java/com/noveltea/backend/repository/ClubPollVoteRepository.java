package com.noveltea.backend.repository;

import com.noveltea.backend.model.ClubPoll;
import com.noveltea.backend.model.ClubPollVote;
import com.noveltea.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClubPollVoteRepository extends JpaRepository<ClubPollVote, Long> {
    Optional<ClubPollVote> findByPollAndUser(ClubPoll poll, User user);
    boolean existsByPollAndUser(ClubPoll poll, User user);
}
