package com.noveltea.backend.controller;

import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.UserRepository;
import com.noveltea.backend.service.FollowerService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/followers")
@RequiredArgsConstructor
public class FollowerController {

    private final FollowerService followerService;
    private final UserRepository userRepository;

    @PostMapping("/{targetUserId}")
    public String followUser(@PathVariable Long targetUserId, Authentication authentication) {

        String emailFromJwt = authentication.getName(); // <-- this is "sara@test.com" in your case

        Long followerId = userRepository.findByEmail(emailFromJwt)
                .map(User::getUserId)
                .orElseThrow(() -> new RuntimeException("User not found for email: " + emailFromJwt));

        followerService.followUser(followerId, targetUserId);
        return "Followed successfully";
    }

    @DeleteMapping("/{targetUserId}")
    public String unfollowUser(@PathVariable Long targetUserId, Authentication authentication) {

        String emailFromJwt = authentication.getName();

        Long followerId = userRepository.findByEmail(emailFromJwt)
                .map(User::getUserId)
                .orElseThrow(() -> new RuntimeException("User not found for email: " + emailFromJwt));

        followerService.unfollowUser(followerId, targetUserId);
        return "Unfollowed successfully";
    }

    @GetMapping("/{userId}/followers")
    public long countFollowers(@PathVariable Long userId) {
        return followerService.countFollowers(userId);
    }

    @GetMapping("/{userId}/following")
    public long countFollowing(@PathVariable Long userId) {
        return followerService.countFollowing(userId);
    }
}
