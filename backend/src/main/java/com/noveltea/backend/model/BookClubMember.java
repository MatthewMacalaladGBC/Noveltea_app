package com.noveltea.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "book_club_members", uniqueConstraints = {
        // A member can only join a given book club once
        @UniqueConstraint(columnNames = {"user_id", "book_club_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookClubMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long clubMemberId;

    // The user joining the club
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // The club this item belongs to
    @ManyToOne
    @JoinColumn(name = "book_club_id", nullable = false)
    private BookClub bookClub;

    // Owner / Moderator / Member. Only one Owner allowed per club (creator automatically set to Owner)
    @Column(nullable = false)
    private String role;

    @Builder.Default
    @Column(nullable = false)
    private LocalDate joinedDate = LocalDate.now();

}