package com.noveltea.backend.controller;

import com.noveltea.backend.dto.BookClubItemDto;
import com.noveltea.backend.model.BookClubItemStatus;
import com.noveltea.backend.service.BookClubItemService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/club-items")
@RequiredArgsConstructor
public class BookClubItemController extends BaseController {

    private final BookClubItemService bookClubItemService;

    // POST /club-items (owner/mod only)
    @PostMapping
    public ResponseEntity<BookClubItemDto.Response> addBook(
            @Valid @RequestBody BookClubItemDto.AddRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookClubItemService.addBook(userId, request));
    }

    // PATCH /club-items/{clubItemId} (owner/mod only)
    @PatchMapping("/{clubItemId}")
    public ResponseEntity<BookClubItemDto.Response> updateItem(
            @PathVariable Long clubItemId,
            @Valid @RequestBody BookClubItemDto.UpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookClubItemService.updateItem(userId, clubItemId, request));
    }

    // DELETE /club-items/{clubItemId} (owner/mod only)
    @DeleteMapping("/{clubItemId}")
    public ResponseEntity<Void> removeBook(
            @PathVariable Long clubItemId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        bookClubItemService.removeBook(userId, clubItemId);
        return ResponseEntity.noContent().build();
    }

    // GET /club-items/club/{bookClubId} (club visibility rules apply)
    @GetMapping("/club/{bookClubId}")
    public ResponseEntity<List<BookClubItemDto.Response>> getItemsByClub(
            @PathVariable Long bookClubId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookClubItemService.getItemsByClub(userId, bookClubId));
    }

    // GET /club-items/club/{bookClubId}/status/{status} (UPCOMING/ACTIVE/COMPLETED)
    @GetMapping("/club/{bookClubId}/status/{status}")
    public ResponseEntity<List<BookClubItemDto.Response>> getItemsByStatus(
            @PathVariable Long bookClubId,
            @PathVariable BookClubItemStatus status,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookClubItemService.getItemsByStatus(userId, bookClubId, status));
    }

    // GET /club-items/club/{bookClubId}/current (ACTIVE item)
    @GetMapping("/club/{bookClubId}/current")
    public ResponseEntity<BookClubItemDto.Response> getCurrentRead(
            @PathVariable Long bookClubId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookClubItemService.getCurrentRead(userId, bookClubId));
    }
}
