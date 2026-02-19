package com.noveltea.backend.service;

import com.noveltea.backend.dto.ReviewDto;
import com.noveltea.backend.model.Book;
import com.noveltea.backend.model.Review;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.ReviewRepository;
import com.noveltea.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final BookService bookService;

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            UserRepository userRepository,
            BookService bookService
    ) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.bookService = bookService;
    }

    @Override
    public ReviewDto.Response create(String userIdFromJwt, ReviewDto.CreateRequest request) {
        Long userId = Long.parseLong(userIdFromJwt);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Ensure the book exists in the local db (cache from Open Library metadata)
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

        // Override default visibility if explicitly provided
        if (request.getVisibility() != null) {
            review.setVisibility(request.getVisibility());
        }

        Review saved = reviewRepository.save(review);

        // Recalculate the book's average rating after adding a new review
        bookService.recalculateRating(book.getBookId());

        return toResponse(saved);
    }

    @Override
    public List<ReviewDto.Response> getByBookId(String bookId) {
        return reviewRepository.findByBook_BookId(bookId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void delete(String userIdFromJwt, Long reviewId) {
        Long userId = Long.parseLong(userIdFromJwt);

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        Long ownerId = review.getUser().getUserId();
        if (!ownerId.equals(userId)) {
            throw new RuntimeException("Not allowed to delete this review");
        }

        String bookId = review.getBook().getBookId();
        reviewRepository.delete(review);

        // Recalculate the book's average rating after deleting a review
        bookService.recalculateRating(bookId);
    }

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