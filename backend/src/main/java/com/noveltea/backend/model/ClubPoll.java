package com.noveltea.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "club_polls")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubPoll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pollId;

    @ManyToOne
    @JoinColumn(name = "book_club_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private BookClub bookClub;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("optionId ASC")
    private List<ClubPollOption> options = new ArrayList<>();
}
