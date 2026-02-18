package com.noveltea.backend.repository;

import com.noveltea.backend.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// Book uses String as the ID type (Open Library ID, e.g. "OL7353617M")
// This table acts as an ever-growing table, serving as reference
    // books are initially pulled from API, not pre-populate here
    // books are only saved here when first referenced (faster)
// (e.g. added to a list, reviewed), not managed independently.
// Full book data (description, etc.) is fetched from the Open Library API.
@Repository
public interface BookRepository extends JpaRepository<Book, String> {

    // Used to search locally-cached books by author
    List<Book> findByAuthorIgnoreCase(String author);

    // Used to search locally-cached books by partial title match
    List<Book> findByTitleContainingIgnoreCase(String title);

}
