package com.noveltea.backend.service;

import com.noveltea.backend.dto.ReviewDto;
import com.noveltea.backend.exception.ForbiddenException;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.Book;
import com.noveltea.backend.model.Review;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.ReviewRepository;
import com.noveltea.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.noveltea.backend.model.ReviewLike;
import com.noveltea.backend.repository.ReviewLikeRepository;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final BookService bookService;
    private final ReviewLikeRepository reviewLikeRepository;
    private final GamificationService gamificationService;

    // ---------------- CREATE ----------------

    @Override
    @Transactional
    public ReviewDto.Response create(Long userId, ReviewDto.CreateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Book book = bookService.ensureBookExists(
                request.getBookId(),
                request.getTitle(),
                request.getAuthor(),
                request.getCoverImageUrl(),
                null
        );

        Review review = Review.builder()
                .user(user)
                .book(book)
                .rating(request.getRating())
                .reviewText(request.getReviewText())
                .build();

        if (request.getVisibility() != null) {
            review.setVisibility(request.getVisibility());
        }

        Review saved = reviewRepository.save(review);
        
        gamificationService.awardPoints(userId, GamificationService.POINTS_FOR_REVIEW_CREATED);
        gamificationService.updateDailyStreak(userId);

        // rating recalc after create
        bookService.recalculateRating(book.getBookId());

        return toResponse(saved, userId);
    }

    // ---------------- PUBLIC VIEW ----------------
    // Not logged in: public reviews only
    // Logged in: public reviews + my private reviews for that same book

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto.Response> getByBookId(Long userIdOrNull, String bookId) {

        List<Review> results = new ArrayList<>();

        // public reviews
        results.addAll(reviewRepository.findByBook_BookIdAndVisibilityTrue(bookId));

        // add my private reviews if logged in
        if (userIdOrNull != null) {
            results.addAll(
                    reviewRepository.findByUser_UserIdAndBook_BookIdAndVisibilityFalse(userIdOrNull, bookId)
            );
        }

        return results.stream()
            .map(review -> toResponse(review, userIdOrNull))
            .toList();
    }

    // ---------------- UPDATE ----------------

    @Override
    @Transactional
    public ReviewDto.Response update(Long userId, Long reviewId, ReviewDto.UpdateRequest request) {

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + reviewId));

        if (!review.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Not authorized to update this review");
        }

        boolean ratingChanged = false;

        if (request.getRating() != null) {
            review.setRating(request.getRating());
            ratingChanged = true;
        }
        if (request.getReviewText() != null) {
            review.setReviewText(request.getReviewText());
        }
        if (request.getVisibility() != null) {
            review.setVisibility(request.getVisibility());
        }

        Review saved = reviewRepository.save(review);

        if (ratingChanged) {
            bookService.recalculateRating(saved.getBook().getBookId());
        }

        return toResponse(saved, userId);
    }

    // ---------------- DELETE ----------------

    @Override
    @Transactional
    public void delete(Long userId, Long reviewId) {

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + reviewId));

        if (!review.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Not authorized to delete this review");
        }

        String bookId = review.getBook().getBookId();
        gamificationService.removePoints(userId, GamificationService.POINTS_REMOVED_WHEN_REVIEW_DELETED);
        reviewRepository.delete(review);

        // rating recalc after delete
        bookService.recalculateRating(bookId);
    }

    // ---------------- BY USER ----------------

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto.Response> getByUserId(Long requesterId, Long targetUserId) {
        List<Review> reviews;
        if (requesterId != null && requesterId.equals(targetUserId)) {
            reviews = reviewRepository.findByUser_UserId(targetUserId);
        } else {
            reviews = reviewRepository.findByUser_UserIdAndVisibilityTrue(targetUserId);
        }
        return reviews.stream()
            .map(review -> toResponse(review, requesterId))
            .toList();    }

    // ---------------- COUNT ----------------

    @Override
    @Transactional(readOnly = true)
    public long countByUserId(Long userId) {
        return reviewRepository.countByUser_UserId(userId);
    }

    // ---------------- DTO MAPPING ----------------

    private ReviewDto.Response toResponse(Review r, Long currentUserId) {
    boolean likedByCurrentUser = false;

    if (currentUserId != null) {
        likedByCurrentUser = reviewLikeRepository.existsByUser_UserIdAndReview_ReviewId(
                currentUserId,
                r.getReviewId()
        );
    }

    return ReviewDto.Response.builder()
            .reviewId(r.getReviewId())
            .userId(r.getUser().getUserId())
            .username(r.getUser().getUsername())
            .bookId(r.getBook().getBookId())
            .bookTitle(r.getBook().getTitle())
            .bookAuthor(r.getBook().getAuthor())
            .coverImageUrl(r.getBook().getCoverImageUrl())
            .rating(r.getRating())
            .reviewText(r.getReviewText())
            .likes(r.getLikes())
            .likedByCurrentUser(likedByCurrentUser)
            .visibility(r.getVisibility())
            .creationDate(r.getCreationDate())
            .build();
}

        // ---------------- Like Reviews ----------------

    @Override
    @Transactional
    public ReviewDto.Response likeReview(Long userId, Long reviewId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + reviewId));

        if (review.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("You cannot like your own review");
        }

        if (Boolean.FALSE.equals(review.getVisibility())) {
            throw new ForbiddenException("This review cannot be liked");
        }

        boolean alreadyLiked = reviewLikeRepository.existsByUserAndReview(user, review);
        if (alreadyLiked) {
            return toResponse(review, userId);
        }

        ReviewLike reviewLike = ReviewLike.builder()
                .user(user)
                .review(review)
                .build();

        reviewLikeRepository.save(reviewLike);

        gamificationService.addReceivedLike(review.getUser().getUserId());

        gamificationService.updateDailyStreak(userId);

        review.setLikes((int) reviewLikeRepository.countByReview(review));
        Review savedReview = reviewRepository.save(review);

        return toResponse(savedReview, userId); 
    }
    // ---------------- Unlike Reviews ----------------


    @Override
    @Transactional
    public ReviewDto.Response unlikeReview(Long userId, Long reviewId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + reviewId));

        ReviewLike reviewLike = reviewLikeRepository.findByUserAndReview(user, review)
                .orElseThrow(() -> new ResourceNotFoundException("Like not found for this review"));

        reviewLikeRepository.delete(reviewLike);

        gamificationService.removeReceivedLike(review.getUser().getUserId());
        gamificationService.updateDailyStreak(userId);

        review.setLikes((int) reviewLikeRepository.countByReview(review));
        Review savedReview = reviewRepository.save(review);

        return toResponse(savedReview, userId);
    }
}
