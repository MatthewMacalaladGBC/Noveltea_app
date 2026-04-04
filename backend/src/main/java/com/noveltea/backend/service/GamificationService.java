package com.noveltea.backend.service;

import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final UserRepository userRepository;

    public static final int POINTS_FOR_REVIEW_CREATED = 5;
    public static final int POINTS_FOR_RECEIVING_REVIEW_LIKE = 2;
    public static final int POINTS_REMOVED_WHEN_REVIEW_DELETED = 5;
    public static final int POINTS_REMOVED_WHEN_REVIEW_UNLIKED = 2;

    @Transactional
    public void awardPoints(Long userId, int pointsToAdd) {
        User user = userRepository.findById(userId).orElseThrow();
        int current = user.getPoints() == null ? 0 : user.getPoints();
        user.setPoints(current + pointsToAdd);
        userRepository.save(user);
    }

    @Transactional
    public void removePoints(Long userId, int pointsToRemove) {
        User user = userRepository.findById(userId).orElseThrow();
        int current = user.getPoints() == null ? 0 : user.getPoints();
        int updated = Math.max(0, current - pointsToRemove);
        user.setPoints(updated);
        userRepository.save(user);
    }

    @Transactional
    public void addReceivedLike(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        int currentLikes = user.getReviewLikesReceived() == null ? 0 : user.getReviewLikesReceived();
        int currentPoints = user.getPoints() == null ? 0 : user.getPoints();

        user.setReviewLikesReceived(currentLikes + 1);
        user.setPoints(currentPoints + POINTS_FOR_RECEIVING_REVIEW_LIKE);

        userRepository.save(user);
    }

    @Transactional
    public void removeReceivedLike(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        int currentLikes = user.getReviewLikesReceived() == null ? 0 : user.getReviewLikesReceived();
        int currentPoints = user.getPoints() == null ? 0 : user.getPoints();

        user.setReviewLikesReceived(Math.max(0, currentLikes - 1));
        user.setPoints(Math.max(0, currentPoints - POINTS_REMOVED_WHEN_REVIEW_UNLIKED));

        userRepository.save(user);
    }

    @Transactional
    public void updateDailyStreak(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        LocalDate today = LocalDate.now();
        LocalDate lastActive = user.getLastActiveDate();

        // first ever activity
        if (lastActive == null) {
            user.setCurrentStreak(1);
            user.setLongestStreak(1);
            user.setLastActiveDate(today);
            userRepository.save(user);
            return;
        }

        // already active today -> do nothing
        if (lastActive.equals(today)) {
            return;
        }

        // active yesterday -> continue streak
        if (lastActive.equals(today.minusDays(1))) {
            int newStreak = (user.getCurrentStreak() == null ? 0 : user.getCurrentStreak()) + 1;
            user.setCurrentStreak(newStreak);

            int longest = user.getLongestStreak() == null ? 0 : user.getLongestStreak();
            if (newStreak > longest) {
                user.setLongestStreak(newStreak);
            }

            user.setLastActiveDate(today);
            userRepository.save(user);
            return;
        }

        // missed at least one day -> reset streak to 1
        user.setCurrentStreak(1);

        int longest = user.getLongestStreak() == null ? 0 : user.getLongestStreak();
        if (longest < 1) {
            user.setLongestStreak(1);
        }

        user.setLastActiveDate(today);
        userRepository.save(user);
    }
}