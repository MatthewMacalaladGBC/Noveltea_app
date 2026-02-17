package com.noveltea.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "book_reviews") // No unique constraint (user can leave multiple reviews on a book)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reviewId;

    // The user leaving the review
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // The book this review is for
    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @DecimalMin("0.0")
    @DecimalMax("5.0")
    @Column(precision = 2, scale = 1, nullable=false)
    private BigDecimal rating;

    @Column(columnDefinition = "TEXT")
    private String reviewText;

    @Builder.Default
    @Column(nullable = false)
    private Integer likes = 0;

    // Defaults to true (public, visible to all)
    @Builder.Default
    @Column(nullable = false)
    private Boolean visibility = true;

    @Builder.Default
    @Column(nullable = false)
    private LocalDate creationDate = LocalDate.now();

}