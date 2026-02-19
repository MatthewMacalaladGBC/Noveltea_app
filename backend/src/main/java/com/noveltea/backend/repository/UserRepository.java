package com.noveltea.backend.repository;

import com.noveltea.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Checks if a username exists in the db
    boolean existsByUsername(String username);

    // Checks if an email exists in the db
    boolean existsByEmail(String email);

    // Look for a username in the database (returning user if found)
    Optional<User> findByUsername(String username);

    // Look for an email in the database (returning user if found)
    Optional<User> findByEmail(String email);

    // Look for all usernames containing an entered string
    List<User> findByUsernameContainingIgnoreCase(String username);

}
