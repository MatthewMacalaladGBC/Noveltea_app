package com.noveltea.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;

@Entity
@Table(name = "club_join_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubJoinRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne
    @JoinColumn(name = "book_club_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private BookClub bookClub;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClubJoinRequestStatus status;

    @Builder.Default
    @Column(nullable = false)
    private LocalDate requestedAt = LocalDate.now();

}
