package com.noveltea.backend.repository;

import com.noveltea.backend.model.ClubAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClubAnnouncementRepository extends JpaRepository<ClubAnnouncement, Long> {
    Optional<ClubAnnouncement> findByBookClub_BookClubId(Long bookClubId);
}
