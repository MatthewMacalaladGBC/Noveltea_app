package com.noveltea.backend.controller;

import com.noveltea.backend.dto.ReviewDto;
import com.noveltea.backend.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController extends BaseController {

    private final ReviewService reviewService;

    // POST /reviews (must be logged in)
    @PostMapping
    public ResponseEntity<ReviewDto.Response> create(
            @Valid @RequestBody ReviewDto.CreateRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(userId, request));
    }

    // GET /reviews/book/{bookId} (public)
    // logged in -> sees public + their private
    // not logged in -> sees public only
    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<ReviewDto.Response>> getByBook(
            @PathVariable String bookId,
            HttpServletRequest httpRequest
    ) {
        Long userIdOrNull = getUserId(httpRequest);
        return ResponseEntity.ok(reviewService.getByBookId(userIdOrNull, bookId));
    }

    // PATCH /reviews/{reviewId} (must be logged in + owner)
    @PatchMapping("/{reviewId}")
    public ResponseEntity<ReviewDto.Response> update(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewDto.UpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return ResponseEntity.ok(reviewService.update(userId, reviewId, request));
    }

    // GET /reviews/me/count — total reviews written by the authenticated user
    @GetMapping("/me/count")
    public ResponseEntity<Long> getMyReviewCount(HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return ResponseEntity.ok(reviewService.countByUserId(userId));
    }

    // DELETE /reviews/{reviewId} (must be logged in + owner)
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long reviewId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        reviewService.delete(userId, reviewId);
        return ResponseEntity.noContent().build();
    }
}
