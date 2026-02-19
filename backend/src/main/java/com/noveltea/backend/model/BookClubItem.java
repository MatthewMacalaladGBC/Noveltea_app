package com.noveltea.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;

@Entity
@Table(name = "book_club_items", uniqueConstraints = {
        // A book can only be added to a given club once
        @UniqueConstraint(columnNames = {"book_id", "book_club_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookClubItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long clubItemId;

    // The book being read by the club
    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Book book;

    // The club this item belongs to
    @ManyToOne
    @JoinColumn(name = "book_club_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private BookClub bookClub;

    // Set automatically when status transitions to Active; nullable for Upcoming items
    @Column
    private LocalDate startDate;

    // Nullable because you can have a book active indefinitely, but can still set an end date if needed
    @Column
    private LocalDate endDate;

    // Active / Upcoming / Completed. Only one Active item allowed at one time per club
    @Column(nullable = false)
    private String status;

    @Builder.Default
    @Column(nullable = false)
    private LocalDate addedDate = LocalDate.now();
    
}