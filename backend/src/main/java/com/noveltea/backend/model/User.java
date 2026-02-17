package com.noveltea.backend.model;

import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.*;

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

}