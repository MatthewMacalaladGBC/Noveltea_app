package com.noveltea.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "book_lists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long listId;

    // The user who created this list
    @ManyToOne
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // true = public (visible to all and can be followed), false = private
    @Builder.Default
    @Column(nullable = false)
    private Boolean visibility = true;

    @Builder.Default
    @Column(nullable = false)
    private LocalDate creationDate = LocalDate.now();

}
