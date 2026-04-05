package com.noveltea.backend.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class MaturityCheckService {

    private static final String GOOGLE_BOOKS_URL =
        "https://www.googleapis.com/books/v1/volumes?q=isbn:";
    private final RestTemplate restTemplate = new RestTemplate();

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Cache ratings so we don't call Google Books on every request
    private final Map<String, String> ratingCache = new ConcurrentHashMap<>();

    /**
     * Fetches the maturity rating for a book ISBN from Google Books API.
     * Returns "MATURE" or "NOT_MATURE". Defaults to "NOT_MATURE" if not found.
     */
    public String getMaturityRating(String isbn) {
        if (ratingCache.containsKey(isbn)) {
            return ratingCache.get(isbn);
        }

        try {
            String url = GOOGLE_BOOKS_URL + isbn;
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);

            String rating = "NOT_MATURE";
            if (root.path("totalItems").asInt() > 0) {
                rating = root
                    .path("items").get(0)
                    .path("volumeInfo")
                    .path("maturityRating")
                    .asText("NOT_MATURE");
            }

            ratingCache.put(isbn, rating);
            return rating;

        } catch (Exception e) {
            // If Google Books is unreachable, fail open — don't block the book
            System.err.println("[MaturityCheckService] Google Books API error: " + e.getMessage());
            return "NOT_MATURE";
        }
    }

    /**
     * Returns true if the book is mature AND the user is under 18.
     */
    public boolean isBlockedForUser(String isbn, int userAge) {
        if (userAge >= 18) return false;
        return "MATURE".equals(getMaturityRating(isbn));
    }
}