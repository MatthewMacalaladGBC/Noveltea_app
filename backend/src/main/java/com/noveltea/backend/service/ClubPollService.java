package com.noveltea.backend.service;

import com.noveltea.backend.dto.ClubPollDto;
import com.noveltea.backend.exception.DuplicateResourceException;
import com.noveltea.backend.exception.ForbiddenException;
import com.noveltea.backend.exception.InvalidRequestException;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.*;
import com.noveltea.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClubPollService {

    private final ClubPollRepository pollRepository;
    private final ClubPollOptionRepository optionRepository;
    private final ClubPollVoteRepository voteRepository;
    private final BookClubRepository bookClubRepository;
    private final BookClubMemberRepository bookClubMemberRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    // POST — owner/mod creates a poll; closes any existing active poll first
    @Transactional
    public ClubPollDto.Response createPoll(Long userId, Long clubId, ClubPollDto.CreateRequest request) {
        BookClub club = bookClubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        requireOwnerOrMod(userId, club);

        // Close any existing active polls
        pollRepository.findByBookClubAndActiveTrue(club)
                .forEach(p -> { p.setActive(false); pollRepository.save(p); });

        ClubPoll poll = ClubPoll.builder()
                .bookClub(club)
                .createdBy(creator)
                .question(request.getQuestion())
                .build();
        poll = pollRepository.save(poll);

        // Create options
        for (String text : request.getOptions()) {
            ClubPollOption opt = ClubPollOption.builder()
                    .poll(poll)
                    .optionText(text)
                    .build();
            poll.getOptions().add(optionRepository.save(opt));
        }

        gamificationService.updateDailyStreak(userId);

        return toResponse(poll, null);
    }

    // GET — active poll for the club (any member)
    @Transactional(readOnly = true)
    public Optional<ClubPollDto.Response> getActivePoll(Long userId, Long clubId) {
        BookClub club = bookClubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));

        return pollRepository.findFirstByBookClubAndActiveTrue(club)
                .map(poll -> {
                    Long votedOptionId = null;
                    if (userId != null) {
                        User user = userRepository.findById(userId).orElse(null);
                        if (user != null) {
                            votedOptionId = voteRepository.findByPollAndUser(poll, user)
                                    .map(v -> v.getOption().getOptionId())
                                    .orElse(null);
                        }
                    }
                    return toResponse(poll, votedOptionId);
                });
    }

    // POST /{pollId}/vote — any member; one vote per user per poll
    @Transactional
    public ClubPollDto.Response vote(Long userId, Long pollId, ClubPollDto.VoteRequest request) {
        ClubPoll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found: " + pollId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!poll.isActive()) {
            throw new InvalidRequestException("This poll is closed");
        }
        if (voteRepository.existsByPollAndUser(poll, user)) {
            throw new DuplicateResourceException("You have already voted in this poll");
        }

        ClubPollOption option = optionRepository.findById(request.getOptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Option not found: " + request.getOptionId()));

        if (!option.getPoll().getPollId().equals(pollId)) {
            throw new InvalidRequestException("Option does not belong to this poll");
        }

        // Record vote and increment count
        voteRepository.save(ClubPollVote.builder().poll(poll).option(option).user(user).build());
        option.setVoteCount(option.getVoteCount() + 1);
        optionRepository.save(option);
        
        gamificationService.updateDailyStreak(userId);

        // Reload poll to reflect updated vote count
        ClubPoll refreshed = pollRepository.findById(pollId).orElseThrow();
        return toResponse(refreshed, option.getOptionId());
    }

    // POST /{pollId}/close — owner/mod closes the poll
    @Transactional
    public ClubPollDto.Response closePoll(Long userId, Long pollId) {
        ClubPoll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found: " + pollId));

        requireOwnerOrMod(userId, poll.getBookClub());

        poll.setActive(false);
        return toResponse(pollRepository.save(poll), null);
    }

    // DELETE /{pollId} — owner/mod deletes the poll
    @Transactional
    public void deletePoll(Long userId, Long pollId) {
        ClubPoll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found: " + pollId));

        requireOwnerOrMod(userId, poll.getBookClub());
        pollRepository.delete(poll);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void requireOwnerOrMod(Long userId, BookClub club) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        BookClubMember member = bookClubMemberRepository.findByUserAndBookClub(user, club)
                .orElseThrow(() -> new ForbiddenException("Not a member of this club"));
        if (member.getRole() == BookClubMemberRole.MEMBER) {
            throw new ForbiddenException("Only owners and moderators can manage polls");
        }
    }

    private ClubPollDto.Response toResponse(ClubPoll poll, Long userVotedOptionId) {
        List<ClubPollDto.OptionResponse> options = poll.getOptions().stream()
                .map(o -> ClubPollDto.OptionResponse.builder()
                        .optionId(o.getOptionId())
                        .optionText(o.getOptionText())
                        .voteCount(o.getVoteCount())
                        .build())
                .toList();

        return ClubPollDto.Response.builder()
                .pollId(poll.getPollId())
                .clubId(poll.getBookClub().getBookClubId())
                .question(poll.getQuestion())
                .active(poll.isActive())
                .createdAt(poll.getCreatedAt())
                .createdByUsername(poll.getCreatedBy().getUsername())
                .options(options)
                .userVotedOptionId(userVotedOptionId)
                .build();
    }
}
