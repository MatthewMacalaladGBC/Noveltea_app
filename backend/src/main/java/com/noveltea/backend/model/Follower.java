package com.noveltea.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "followers", uniqueConstraints = {
        // Constraint enforces that one user cannot follow the same user twice
        @UniqueConstraint(columnNames = {"follower_id", "followed_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Follower {

    // Generated ID for the follow relationship
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user who is doing the following
    @ManyToOne
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    // The user being followed
    @ManyToOne
    @JoinColumn(name = "followed_id", nullable = false)
    private User followed;

    @Builder.Default
    @Column(nullable = false)
    private LocalDate creationDate = LocalDate.now();
}
