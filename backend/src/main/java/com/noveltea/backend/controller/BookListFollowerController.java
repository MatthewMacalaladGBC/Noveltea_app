package com.noveltea.backend.controller;

import com.noveltea.backend.dto.BookListFollowerDto;
import com.noveltea.backend.service.BookListFollowerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/list-followers")
@RequiredArgsConstructor
public class BookListFollowerController extends BaseController {

    private final BookListFollowerService bookListFollowerService;

    // POST /list-followers  (follow a list)
    @PostMapping
    public ResponseEntity<BookListFollowerDto.Response> followList(
            @Valid @RequestBody BookListFollowerDto.Request request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookListFollowerService.followList(userId, request));
    }

    // DELETE /list-followers/{listFollowerId}  (unfollow by relationship id)
    @DeleteMapping("/{listFollowerId}")
    public ResponseEntity<Void> unfollowList(
            @PathVariable Long listFollowerId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        bookListFollowerService.unfollowList(userId, listFollowerId);
        return ResponseEntity.noContent().build();
    }

    // GET /list-followers/list/{listId}  (all followers of a list)
    @GetMapping("/list/{listId}")
    public ResponseEntity<List<BookListFollowerDto.Response>> getFollowersByList(@PathVariable Long listId) {
        return ResponseEntity.ok(bookListFollowerService.getFollowersByList(listId));
    }

    // GET /list-followers/me  (all lists I follow)
    @GetMapping("/me")
    public ResponseEntity<List<BookListFollowerDto.Response>> getFollowedListsByMe(HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(bookListFollowerService.getFollowedListsByUser(userId));
    }
}
