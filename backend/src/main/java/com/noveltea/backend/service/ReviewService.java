package com.noveltea.backend.service;

import com.noveltea.backend.dto.ReviewDto;

import java.util.List;

public interface ReviewService {

    ReviewDto.Response create(Long userId, ReviewDto.CreateRequest request);

    // public view: returns public reviews
    // logged in: returns public + your own private reviews for that book
    List<ReviewDto.Response> getByBookId(Long userIdOrNull, String bookId);

    ReviewDto.Response update(Long userId, Long reviewId, ReviewDto.UpdateRequest request);

    void delete(Long userId, Long reviewId);
}
