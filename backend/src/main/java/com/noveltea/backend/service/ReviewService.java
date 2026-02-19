package com.noveltea.backend.service;

import com.noveltea.backend.dto.ReviewDto;

import java.util.List;

public interface ReviewService {
    ReviewDto.Response create(String userIdFromJwt, ReviewDto.CreateRequest request);
    List<ReviewDto.Response> getByBookId(String bookId);
    void delete(String userIdFromJwt, Long reviewId);
}
