package com.noveltea.backend.service;

import com.noveltea.backend.dto.ReviewDto;

import java.util.List;

public interface ReviewService {
    ReviewDto create(String userIdFromJwt, ReviewDto dto);
    List<ReviewDto> getByBookId(String bookId);
    void delete(String userIdFromJwt, Long reviewId);
}
