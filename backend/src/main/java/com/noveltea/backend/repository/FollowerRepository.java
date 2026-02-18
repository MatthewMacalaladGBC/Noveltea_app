package com.noveltea.backend.repository;

import com.noveltea.backend.model.Follower;
import com.noveltea.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowerRepository extends JpaRepository<Follower, Long> {

    // All users that a given user is following
    List<Follower> findByFollower(User follower);

    // All followers of a given user
    List<Follower> findByFollowed(User followed);

    // Check if a follow relationship already exists (before creating)
    boolean existsByFollowerAndFollowed(User follower, User followed);

    // Retrieve specific relationship (needed to get the ID for deletion (unfollow))
    Optional<Follower> findByFollowerAndFollowed(User follower, User followed);

    // Follower / following counts for profile display
    long countByFollowed(User followed);
    long countByFollower(User follower);

}