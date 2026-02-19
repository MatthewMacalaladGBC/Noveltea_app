package com.noveltea.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

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

    
    @Id
    // Generated ID for the follow relationship
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user who is doing the following
    @ManyToOne(optional = false)
    @JoinColumn(name = "follower_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User follower;

    // The user being followed
    @ManyToOne(optional = false)
    @JoinColumn(name = "followed_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User followed;

    @Builder.Default
    @Column(nullable = false)
    private LocalDate creationDate = LocalDate.now();
}
