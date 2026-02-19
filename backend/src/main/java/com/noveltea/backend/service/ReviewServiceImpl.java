package com.noveltea.backend.service;

import com.noveltea.backend.dto.ReviewDto;
import com.noveltea.backend.model.Book;
import com.noveltea.backend.model.Review;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.BookRepository;
import com.noveltea.backend.repository.ReviewRepository;
import com.noveltea.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            UserRepository userRepository,
            BookRepository bookRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    @Override
    public ReviewDto create(String userIdFromJwt, ReviewDto dto) {
        Long userId = Long.parseLong(userIdFromJwt);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Book book = bookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new RuntimeException("Book not found"));

        Review review = Review.builder()
                .user(user)
                .book(book)
                .rating(BigDecimal.valueOf(dto.getRating()))
                .reviewText(dto.getReviewText())
                .likes(0)
                .visibility(true)
                .creationDate(LocalDate.now())
                .build();

        Review saved = reviewRepository.save(review);

        return toDto(saved);
    }

    @Override
    public List<ReviewDto> getByBookId(String bookId) {
        return reviewRepository.findByBook_BookId(bookId)
                .stream()
                .map(this::toDto)
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

        reviewRepository.delete(review);
    }

    private ReviewDto toDto(Review r) {
        ReviewDto dto = new ReviewDto();
        dto.setReviewId(r.getReviewId());
        dto.setUserId(r.getUser().getUserId());
        dto.setUsername(r.getUser().getUsername());
        dto.setBookId(r.getBook().getBookId());
        dto.setRating(r.getRating() == null ? null : r.getRating().doubleValue());
        dto.setReviewText(r.getReviewText());
        dto.setLikes(r.getLikes());
        dto.setVisibility(r.getVisibility());
        dto.setCreationDate(r.getCreationDate());
        return dto;
    }
}
