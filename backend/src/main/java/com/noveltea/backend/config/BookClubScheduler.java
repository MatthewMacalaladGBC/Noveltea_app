package com.noveltea.backend.config;

import com.noveltea.backend.model.BookClubItem;
import com.noveltea.backend.model.BookClubItemStatus;
import com.noveltea.backend.repository.BookClubItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Daily scheduler that automatically transitions UPCOMING club items to ACTIVE
 * when their startDate has been reached.
 *
 * Rules:
 *   - Only items with status=UPCOMING and startDate <= today are eligible.
 *   - If the club already has an ACTIVE item, it is first moved to COMPLETED.
 *   - Runs at midnight server time every day.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookClubScheduler {

    private final BookClubItemRepository bookClubItemRepository;

    @Scheduled(cron = "0 0 0 * * *")  // midnight every day
    @Transactional
    public void activateDueItems() {
        LocalDate today = LocalDate.now();
        List<BookClubItem> due = bookClubItemRepository
                .findByStatusAndStartDateLessThanEqual(BookClubItemStatus.UPCOMING, today);

        if (due.isEmpty()) return;

        log.info("BookClubScheduler: {} item(s) due for activation on {}", due.size(), today);

        for (BookClubItem item : due) {
            // Auto-complete any currently active item in the same club
            bookClubItemRepository
                    .findFirstByBookClubAndStatus(item.getBookClub(), BookClubItemStatus.ACTIVE)
                    .ifPresent(current -> {
                        current.setStatus(BookClubItemStatus.COMPLETED);
                        bookClubItemRepository.save(current);
                        log.info("BookClubScheduler: completed '{}' in club '{}'",
                                current.getBook().getTitle(), item.getBookClub().getName());
                    });

            item.setStatus(BookClubItemStatus.ACTIVE);
            bookClubItemRepository.save(item);
            log.info("BookClubScheduler: activated '{}' in club '{}'",
                    item.getBook().getTitle(), item.getBookClub().getName());
        }
    }
}
