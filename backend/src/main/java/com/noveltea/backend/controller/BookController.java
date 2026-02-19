package com.noveltea.backend.controller;

import com.noveltea.backend.dto.BookDto;
import com.noveltea.backend.exception.InvalidRequestException;
import com.noveltea.backend.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    // GET /books
    @GetMapping
    public ResponseEntity<List<BookDto.Response>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    // GET /books/{bookId}
    @GetMapping("/{bookId}")
    public ResponseEntity<BookDto.Response> getBookById(@PathVariable String bookId) {
        return ResponseEntity.ok(bookService.getBookById(bookId));
    }

    // GET /books/search?title=... OR ?author=...
    @GetMapping("/search")
    public ResponseEntity<List<BookDto.Response>> search(
        @RequestParam(required = false) String title, 
        @RequestParam(required = false) String author
    ) {
        if (title != null) {
            return ResponseEntity.ok(bookService.searchByTitle(title));
        }
        if (author != null) {
            return ResponseEntity.ok(bookService.searchByAuthor(author));
        }
        throw new InvalidRequestException("Provide either 'title' or 'author' as a query parameter.");
    }
}
