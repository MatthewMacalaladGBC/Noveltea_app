package com.noveltea.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;

@Entity
@Table(name = "book_list_followers", uniqueConstraints = {
        // A user can only follow a given list once
        @UniqueConstraint(columnNames = {"user_id", "list_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookListFollower {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long listFollowerId;

    // The user following the list
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    // The list being followed (must be visible/public)
    @ManyToOne
    @JoinColumn(name = "list_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private BookList bookList;

    @Builder.Default
    @Column(nullable = false)
    private LocalDate followedDate = LocalDate.now();

}