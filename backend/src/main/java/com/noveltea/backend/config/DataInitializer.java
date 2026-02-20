package com.noveltea.backend.config;

import com.noveltea.backend.model.BookList;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.BookListRepository;
import com.noveltea.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with two baseline users on startup (skipped if they already exist).
 * Also ensures each seeded user has a "Library" list (idempotent — safe to run on every startup).
 *
 * Base Credentials for testing / demo:
 *   standard user  → email: user@noveltea.com    password: password123
 *   admin user     → email: admin@noveltea.com   password: admin123
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BookListRepository bookListRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedUser("novelteauser", "user@noveltea.com", "password123", "standard");
        seedUser("novelteaadmin", "admin@noveltea.com", "admin123", "admin");
    }

    private void seedUser(String username, String email, String rawPassword, String role) {
        User user;

        if (userRepository.existsByEmail(email)) {
            log.info("Seed user '{}' already exists — skipping creation.", username);
            user = userRepository.findByEmail(email).orElseThrow();
        } else {
            user = User.builder()
                    .username(username)
                    .email(email)
                    .hashedPassword(passwordEncoder.encode(rawPassword))
                    .role(role)
                    .build();
            userRepository.save(user);
            log.info("Seeded {} user '{}'.", role, username);
        }

        // Ensure the user has a Library list (idempotent)
        if (!bookListRepository.existsByCreatorAndTitle(user, "Library")) {
            bookListRepository.save(BookList.builder()
                    .creator(user)
                    .title("Library")
                    .description("My personal library")
                    .visibility(false)
                    .build());
            log.info("Created Library list for '{}'.", username);
        }
    }
}
