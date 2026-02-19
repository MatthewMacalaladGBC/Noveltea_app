package com.noveltea.backend.service;

import com.noveltea.backend.dto.BookListFollowerDto;
import com.noveltea.backend.model.BookList;
import com.noveltea.backend.model.BookListFollower;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.BookListFollowerRepository;
import com.noveltea.backend.repository.BookListRepository;
import com.noveltea.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookListFollowerService {

    private final BookListFollowerRepository bookListFollowerRepository;
    private final BookListRepository bookListRepository;
    private final UserRepository userRepository;

    // ----- CORE OPERATIONS -----

    /**
     * Authenticated user follows a list.
     * Ensures that list is public and user does not already follow the list.
     */
    @Transactional
    public BookListFollowerDto.Response followList(Long userId, BookListFollowerDto.Request request) {
        BookList bookList = bookListRepository.findById(request.getListId())
                .orElseThrow(() -> new RuntimeException("Book list not found: " + request.getListId()));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Private lists are only visible to their creator
        if (!bookList.getVisibility() && !bookList.getCreator().getUserId().equals(userId)) {
            throw new RuntimeException("Cannot follow a private list");
        }

        if (bookListFollowerRepository.existsByUserAndBookList(user, bookList)) {
            throw new RuntimeException("User is already following this book list");
        }

        BookListFollower bookListFollower = BookListFollower.builder()
                .user(user)
                .bookList(bookList)
                .build();

        return mapToResponse(bookListFollowerRepository.save(bookListFollower));

    }

    /**
     * Authenticated user unfollows the chosen list
     */
    @Transactional
    public void unfollowList(Long userId, Long listFollowerId) {
        BookListFollower bookListFollower = bookListFollowerRepository.findById(listFollowerId)
                .orElseThrow(() -> new RuntimeException("List item not found: " + listFollowerId));

        if (!bookListFollower.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Cannot unfollow for another user");
        }

        bookListFollowerRepository.delete(bookListFollower);
    }


    // ----- READ OPERATIONS -----

    /**
     * Returns all followers of a list.
     */
    @Transactional(readOnly = true)
    public List<BookListFollowerDto.Response> getFollowersByList(Long listId) {
        BookList bookList = bookListRepository.findById(listId)
                .orElseThrow(() -> new RuntimeException("Book list not found: " + listId));

        return bookListFollowerRepository.findByBookList(bookList).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Returns all lists followed by a user.
     */
    @Transactional(readOnly = true)
    public List<BookListFollowerDto.Response> getFollowedListsByUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        return bookListFollowerRepository.findByUser(user).stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ----- DTO MAPPING -----

    private BookListFollowerDto.Response mapToResponse(BookListFollower bookListFollower) {
        return BookListFollowerDto.Response.builder()
            .listFollowerId(bookListFollower.getListFollowerId())
            .listId(bookListFollower.getBookList().getListId())
            .listTitle(bookListFollower.getBookList().getTitle())
            .userId(bookListFollower.getUser().getUserId())
            .username(bookListFollower.getUser().getUsername())
            .followedDate(bookListFollower.getFollowedDate())
            .build();               
    }

}