package com.noveltea.backend.controller;

import com.noveltea.backend.dto.BookClubDto;
import com.noveltea.backend.service.BookClubService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clubs")
@RequiredArgsConstructor
public class BookClubController extends BaseController {

    private final BookClubService bookClubService;

    // POST /clubs (must be logged in)
    @PostMapping
    public ResponseEntity<BookClubDto.Response> createClub(
            @Valid @RequestBody BookClubDto.CreateRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookClubService.createClub(userId, request));
    }

    // PUT /clubs/{clubId} (must be logged in, owner or moderator)
    @PutMapping("/{clubId}")
    public ResponseEntity<BookClubDto.Response> updateClub(
            @PathVariable Long clubId,
            @Valid @RequestBody BookClubDto.UpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookClubService.updateClub(userId, clubId, request));
    }

    // DELETE /clubs/{clubId} (must be logged in, owner only)
    @DeleteMapping("/{clubId}")
    public ResponseEntity<Void> deleteClub(
            @PathVariable Long clubId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        bookClubService.deleteClub(userId, clubId);
        return ResponseEntity.noContent().build();
    }

    // GET /clubs/{clubId} (public if club is public; private requires membership)
    @GetMapping("/{clubId}")
    public ResponseEntity<BookClubDto.Response> getClubById(
            @PathVariable Long clubId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookClubService.getClubById(userId, clubId));
    }

    // GET /clubs (public) - list all public clubs
    @GetMapping
    public ResponseEntity<List<BookClubDto.Response>> getPublicClubs() {
        return ResponseEntity.ok(bookClubService.getPublicClubs());
    }

    // GET /clubs/search?name=... (public) - search public clubs
    @GetMapping("/search")
    public ResponseEntity<List<BookClubDto.Response>> searchPublicClubs(@RequestParam String name) {
        return ResponseEntity.ok(bookClubService.searchPublicClubs(name));
    }
}
