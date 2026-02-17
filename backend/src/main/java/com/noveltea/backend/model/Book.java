package com.noveltea.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "books")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

    // Open Library ID (e.g. "OL7353617M") — don't need to generate ourselves
    @Id
    @Column(nullable = false)
    private String bookId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    // Rating derived from user reviews (0.0 – 5.0 star system)
    @Builder.Default
    @DecimalMin("0.0")
    @DecimalMax("5.0")
    @Column(precision = 2, scale = 1, nullable=false)
    private BigDecimal rating = BigDecimal.ZERO;

    // Fetched from Open Library API when not cached locally, nullable
    @Column(columnDefinition = "TEXT")
    private String description;

    // Will use a placeholder image on the frontend when absent, nullable
    @Column(name = "cover_image_url")
    private String coverImageUrl;
}
