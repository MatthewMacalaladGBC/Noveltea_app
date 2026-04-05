package com.noveltea.backend.controller;

import com.noveltea.backend.dto.ClubAnnouncementDto;
import com.noveltea.backend.service.ClubAnnouncementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/clubs/{clubId}/announcement")
@RequiredArgsConstructor
public class ClubAnnouncementController extends BaseController {

    private final ClubAnnouncementService announcementService;

    // GET /clubs/{clubId}/announcement — any authenticated user
    @GetMapping
    public ResponseEntity<ClubAnnouncementDto.Response> getAnnouncement(@PathVariable Long clubId) {
        return announcementService.getAnnouncement(clubId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // PUT /clubs/{clubId}/announcement — owner/mod only; creates or replaces
    @PutMapping
    public ResponseEntity<ClubAnnouncementDto.Response> setAnnouncement(
            @PathVariable Long clubId,
            @Valid @RequestBody ClubAnnouncementDto.Request request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(announcementService.setAnnouncement(userId, clubId, request));
    }

    // DELETE /clubs/{clubId}/announcement — owner/mod only
    @DeleteMapping
    public ResponseEntity<Void> deleteAnnouncement(
            @PathVariable Long clubId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        announcementService.deleteAnnouncement(userId, clubId);
        return ResponseEntity.noContent().build();
    }
}
