package com.noveltea.backend.repository;

import com.noveltea.backend.model.Review;
import com.noveltea.backend.model.ReviewLike;
import com.noveltea.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    boolean existsByUserAndReview(User user, Review review);

    Optional<ReviewLike> findByUserAndReview(User user, Review review);

    long countByReview(Review review);

    boolean existsByUser_UserIdAndReview_ReviewId(Long userId, Long reviewId);
}