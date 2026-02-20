package com.noveltea.backend.controller;

import com.noveltea.backend.dto.BookListDto;
import com.noveltea.backend.service.BookListService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/lists")
@RequiredArgsConstructor
public class BookListController extends BaseController {

    private final BookListService bookListService;

    // POST /lists
    @PostMapping
    public ResponseEntity<BookListDto.Response> createList(
            @Valid @RequestBody BookListDto.CreateRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookListService.createList(userId, request));
    }

    // PUT /lists/{listId}
    @PutMapping("/{listId}")
    public ResponseEntity<BookListDto.Response> updateList(
            @PathVariable Long listId,
            @Valid @RequestBody BookListDto.UpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookListService.updateList(userId, listId, request));
    }

    // DELETE /lists/{listId}
    @DeleteMapping("/{listId}")
    public ResponseEntity<Void> deleteList(
            @PathVariable Long listId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        bookListService.deleteList(userId, listId);
        return ResponseEntity.noContent().build();
    }

    // GET /lists/{listId}
    @GetMapping("/{listId}")
    public ResponseEntity<BookListDto.Response> getListById(
            @PathVariable Long listId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookListService.getListById(userId, listId));
    }

    // GET /lists/me — returns the authenticated user's own lists (all, including private)
    @GetMapping("/me")
    public ResponseEntity<List<BookListDto.Response>> getMyLists(HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookListService.getListsByUser(userId, userId));
    }

    // GET /lists/user/{targetUserId}
    @GetMapping("/user/{targetUserId}")
    public ResponseEntity<List<BookListDto.Response>> getListsByUser(
            @PathVariable Long targetUserId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookListService.getListsByUser(userId, targetUserId));
    }

    // GET /lists/search?title=...
    @GetMapping("/search")
    public ResponseEntity<List<BookListDto.Response>> searchPublicLists(@RequestParam String title) {
        return ResponseEntity.ok(bookListService.searchPublicLists(title));
    }
}
