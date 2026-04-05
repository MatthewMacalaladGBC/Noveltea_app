package com.noveltea.backend.service;

import com.noveltea.backend.dto.ClubAnnouncementDto;
import com.noveltea.backend.exception.ForbiddenException;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.*;
import com.noveltea.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClubAnnouncementService {

    private final ClubAnnouncementRepository announcementRepository;
    private final BookClubRepository bookClubRepository;
    private final BookClubMemberRepository bookClubMemberRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    // GET — any member (or public club viewer) can read the announcement
    @Transactional(readOnly = true)
    public Optional<ClubAnnouncementDto.Response> getAnnouncement(Long clubId) {
        return announcementRepository.findByBookClub_BookClubId(clubId)
                .map(this::toResponse);
    }

    // PUT — create or update; owner/mod only
    @Transactional
    public ClubAnnouncementDto.Response setAnnouncement(Long userId, Long clubId, ClubAnnouncementDto.Request request) {
        BookClub club = bookClubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        requireOwnerOrMod(userId, club);

        ClubAnnouncement announcement = announcementRepository.findByBookClub_BookClubId(clubId)
                .orElse(ClubAnnouncement.builder().bookClub(club).build());

        announcement.setAuthor(author);
        announcement.setContent(request.getContent());
        announcement.setUpdatedAt(LocalDateTime.now());

        ClubAnnouncement saved = announcementRepository.save(announcement);
        gamificationService.updateDailyStreak(userId);
        return toResponse(saved);    }

    // DELETE — owner/mod only
    @Transactional
    public void deleteAnnouncement(Long userId, Long clubId) {
        BookClub club = bookClubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));

        requireOwnerOrMod(userId, club);

        announcementRepository.findByBookClub_BookClubId(clubId)
                .ifPresent(announcementRepository::delete);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void requireOwnerOrMod(Long userId, BookClub club) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        BookClubMember member = bookClubMemberRepository.findByUserAndBookClub(user, club)
                .orElseThrow(() -> new ForbiddenException("Not a member of this club"));
        if (member.getRole() == BookClubMemberRole.MEMBER) {
            throw new ForbiddenException("Only owners and moderators can manage announcements");
        }
    }

    private ClubAnnouncementDto.Response toResponse(ClubAnnouncement a) {
        return ClubAnnouncementDto.Response.builder()
                .announcementId(a.getAnnouncementId())
                .clubId(a.getBookClub().getBookClubId())
                .authorUsername(a.getAuthor().getUsername())
                .content(a.getContent())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
