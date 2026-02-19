package com.noveltea.backend.controller;

import com.noveltea.backend.dto.ReviewDto;
import com.noveltea.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // CREATE review (needs JWT)
    @PostMapping
    public ResponseEntity<ReviewDto.Response> create(
            @Valid @RequestBody ReviewDto.CreateRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(reviewService.create(userId, request));
    }

    // GET reviews by bookId (public)
    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<ReviewDto.Response>> getByBook(@PathVariable String bookId) {
        return ResponseEntity.ok(reviewService.getByBookId(bookId));
    }

    // DELETE review (needs JWT + must be owner)
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> delete(@PathVariable Long reviewId, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        reviewService.delete(userId, reviewId);
        return ResponseEntity.ok().build();
    }
}
