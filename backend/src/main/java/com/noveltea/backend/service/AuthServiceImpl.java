package com.noveltea.backend.service;

import com.noveltea.backend.dto.AuthResponse;
import com.noveltea.backend.dto.LoginRequest;
import com.noveltea.backend.dto.RegisterRequest;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String username = request.getUsername().trim();

        // If you want unique usernames too (recommended)
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already in use");
        }

        String hashed = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .email(email)
                .username(username)
                .hashedPassword(hashed)
                .role("standard") // ✅ default role
                .build();

        User saved = userRepository.save(user);

        String token = jwtService.generateAccessToken(saved.getUserId(), saved.getEmail());

        return new AuthResponse(
                token,
                new AuthResponse.UserResponse(saved.getUserId(), saved.getUsername(), saved.getEmail())
        );
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        boolean ok = passwordEncoder.matches(request.getPassword(), user.getHashedPassword());
        if (!ok) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateAccessToken(user.getUserId(), user.getEmail());

        return new AuthResponse(
                token,
                new AuthResponse.UserResponse(user.getUserId(), user.getUsername(), user.getEmail())
        );
    }
}
