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

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final BookService bookService;

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

        // rating recalc after create
        bookService.recalculateRating(book.getBookId());

        return toResponse(saved);
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
                .map(this::toResponse)
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

        return toResponse(saved);
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
        reviewRepository.delete(review);

        // rating recalc after delete
        bookService.recalculateRating(bookId);
    }

    // ---------------- COUNT ----------------

    @Override
    @Transactional(readOnly = true)
    public long countByUserId(Long userId) {
        return reviewRepository.countByUser_UserId(userId);
    }

    // ---------------- DTO MAPPING ----------------

    private ReviewDto.Response toResponse(Review r) {
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
                .visibility(r.getVisibility())
                .creationDate(r.getCreationDate())
                .build();
    }
}
