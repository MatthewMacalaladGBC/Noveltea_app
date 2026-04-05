package com.noveltea.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "club_poll_options")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubPollOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long optionId;

    @ManyToOne
    @JoinColumn(name = "poll_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ClubPoll poll;

    @Column(nullable = false)
    private String optionText;

    @Builder.Default
    @Column(nullable = false)
    private int voteCount = 0;
}
