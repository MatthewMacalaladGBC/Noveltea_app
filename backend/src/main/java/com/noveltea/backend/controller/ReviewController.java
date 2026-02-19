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
    public ResponseEntity<ReviewDto> create(@Valid @RequestBody ReviewDto dto, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(reviewService.create(userId, dto));
        
    }

    // GET reviews by bookId (public)
    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<ReviewDto>> getByBook(@PathVariable String bookId) {
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
