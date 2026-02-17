package com.noveltea.backend.model;

import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "book_clubs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookClub {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookClubId;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Defaults to false (public, visible to all)
    @Builder.Default
    @Column(nullable = false)
    private Boolean privacy = false;

    @Builder.Default
    @Column(nullable = false)
    private LocalDate creationDate = LocalDate.now();

}