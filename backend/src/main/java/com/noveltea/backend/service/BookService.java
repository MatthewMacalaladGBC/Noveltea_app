package com.noveltea.backend.service;

import com.noveltea.backend.dto.BookDto;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.Book;
import com.noveltea.backend.model.Review;
import com.noveltea.backend.repository.BookRepository;
import com.noveltea.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final ReviewRepository reviewRepository;

    // ----- CORE DB OPERATIONS -----

    /**
     * Ensures a book exists in the local database.
     * Called by other services (ReviewService, ListItemService, BookClubItemService)
     * whenever a user first references a book. If the book already exists, returns
     * the existing record unchanged. If not, creates a new entry from the provided metadata.
     */
    @Transactional
    public Book ensureBookExists(String bookId, String title, String author,
                                 String coverImageUrl, String description) {
        return bookRepository.findById(bookId)
                .orElseGet(() -> bookRepository.save(
                        Book.builder()
                                .bookId(bookId)
                                .title(title)
                                .author(author)
                                .coverImageUrl(coverImageUrl)
                                .description(description)
                                .build()
                ));
    }

    /**
     * Overload that accepts a BookDto.Request directly.
     * Purely for convenience for when a service already has the DTO.
     */
    @Transactional
    public Book ensureBookExists(BookDto.Request request) {
        return ensureBookExists(
                request.getBookId(),
                request.getTitle(),
                request.getAuthor(),
                request.getCoverImageUrl(),
                request.getDescription()
        );
    }

    // ----- READ OPERATIONS -----

    /**
     * Retrieves a book by its Open Library ID.
     * Throws exception if the book has never been stored in the db.
     */
    @Transactional(readOnly = true)
    public BookDto.Response getBookById(String bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + bookId));
        return mapToResponse(book);
    }

    /**
     * Searches books in db by partial title match (case-insensitive).
     */
    @Transactional(readOnly = true)
    public List<BookDto.Response> searchByTitle(String title) {
        return bookRepository.findByTitleContainingIgnoreCase(title).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Searches books in db by exact author name (case-insensitive).
     */
    @Transactional(readOnly = true)
    public List<BookDto.Response> searchByAuthor(String author) {
        return bookRepository.findByAuthorIgnoreCase(author).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Returns all books in db.
     */
    @Transactional(readOnly = true)
    public List<BookDto.Response> getAllBooks() {
        return bookRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ----- RATING CALCULATION -----

    /**
     * Recalculates a book's average rating from all its reviews.
     * Called by ReviewService after a review is created, updated, or deleted.
     * Rounds to 1 decimal place (e.g. 3.7).
     */
    @Transactional
    public void recalculateRating(String bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + bookId));

        List<Review> reviews = reviewRepository.findByBook(book);

        if (reviews.isEmpty()) {
            book.setRating(BigDecimal.ZERO);
        } else {
            BigDecimal sum = reviews.stream()
                    .map(Review::getRating)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal average = sum.divide(
                    BigDecimal.valueOf(reviews.size()), 1, RoundingMode.HALF_UP
            );

            book.setRating(average);
        }

        bookRepository.save(book);
    }

    // ----- DTO MAPPING -----

    private BookDto.Response mapToResponse(Book book) {
        return BookDto.Response.builder()
                .bookId(book.getBookId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .rating(book.getRating())
                .description(book.getDescription())
                .coverImageUrl(book.getCoverImageUrl())
                .build();
    }

}