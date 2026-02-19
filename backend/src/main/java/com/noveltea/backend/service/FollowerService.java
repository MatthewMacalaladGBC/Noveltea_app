package com.noveltea.backend.service;

import com.noveltea.backend.model.Follower;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.FollowerRepository;
import com.noveltea.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowerService {

    private final FollowerRepository followerRepository;
    private final UserRepository userRepository;

    /**
     * followerId follows followedId
     */
    @Transactional
    public void followUser(Long followerId, Long followedId) {
        if (followerId.equals(followedId)) {
            throw new RuntimeException("You cannot follow yourself.");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("Follower user not found: " + followerId));

        User followed = userRepository.findById(followedId)
                .orElseThrow(() -> new RuntimeException("User to follow not found: " + followedId));

        if (followerRepository.existsByFollowerAndFollowed(follower, followed)) {
            throw new RuntimeException("Already following this user.");
        }

        Follower newFollow = Follower.builder()
                .follower(follower)
                .followed(followed)
                // creationDate auto-defaults in your entity builder
                .build();

        followerRepository.save(newFollow);
    }

    /**
     * followerId unfollows followedId
     */
    @Transactional
    public void unfollowUser(Long followerId, Long followedId) {
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("Follower user not found: " + followerId));

        User followed = userRepository.findById(followedId)
                .orElseThrow(() -> new RuntimeException("User to unfollow not found: " + followedId));

        Follower relationship = followerRepository.findByFollowerAndFollowed(follower, followed)
                .orElseThrow(() -> new RuntimeException("You are not following this user."));

        followerRepository.delete(relationship);
    }

    /**
     * true if followerId follows followedId
     */
    @Transactional(readOnly = true)
    public boolean isFollowing(Long followerId, Long followedId) {
        if (followerId.equals(followedId)) return false;

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("Follower user not found: " + followerId));

        User followed = userRepository.findById(followedId)
                .orElseThrow(() -> new RuntimeException("User not found: " + followedId));

        return followerRepository.existsByFollowerAndFollowed(follower, followed);
    }

    /**
     * List of users who follow userId (followers list)
     */
    @Transactional(readOnly = true)
    public List<User> getFollowers(Long userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        return followerRepository.findByFollowed(target).stream()
                .map(Follower::getFollower)
                .toList();
    }

    /**
     * List of users that userId follows (following list)
     */
    @Transactional(readOnly = true)
    public List<User> getFollowing(Long userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        return followerRepository.findByFollower(target).stream()
                .map(Follower::getFollowed)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countFollowers(Long userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return followerRepository.countByFollowed(target);
    }

    @Transactional(readOnly = true)
    public long countFollowing(Long userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return followerRepository.countByFollower(target);
    }
}
