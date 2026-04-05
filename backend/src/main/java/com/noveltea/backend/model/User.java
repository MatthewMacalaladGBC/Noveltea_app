package com.noveltea.backend.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    // Generated Long id for users (Long preferred to Int, might need to update documentation)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    // Will be hashed before storing
    @Column(nullable = false)
    private String hashedPassword;

    // Can be null (users may choose not to write a bio)
    @Column(columnDefinition = "TEXT")
    private String bio;

    //Date of birth (nullable — not required for seed/admin accounts; maturity check skips if absent)
    @Column
    private LocalDate dateOfBirth;

    // Sets privacy to default to public (false)
    @Builder.Default
    @Column(nullable = false)
    private Boolean privacy = false;

    // Either standard, or admin user (for administrative use only)
    @Column(nullable = false)
    private String role;

    // Sets join date automatically to current date (on account creation)
    @Builder.Default
    @Column(nullable = false)
    private LocalDate joinDate = LocalDate.now();

    @Builder.Default
    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer points = 0;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer reviewLikesReceived = 0;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer currentStreak = 0;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer longestStreak = 0;

    private LocalDate lastActiveDate;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer highestRewardedStreak = 0;
}