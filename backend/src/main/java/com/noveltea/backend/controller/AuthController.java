package com.noveltea.backend.controller;

import com.noveltea.backend.dto.AuthResponse;
import com.noveltea.backend.dto.LoginRequest;
import com.noveltea.backend.dto.MeResponse;
import com.noveltea.backend.dto.RegisterRequest;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.UserRepository;
import com.noveltea.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        return ResponseEntity.ok(new MeResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail()
        ));
    }

}
