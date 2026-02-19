package com.noveltea.backend.repository;

import com.noveltea.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByBook_BookId(String bookId);

}
