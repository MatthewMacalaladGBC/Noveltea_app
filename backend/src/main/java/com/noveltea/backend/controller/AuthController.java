package com.noveltea.backend.controller;

import com.noveltea.backend.dto.AuthResponse;
import com.noveltea.backend.dto.LoginRequest;
import com.noveltea.backend.dto.RegisterRequest;
import com.noveltea.backend.dto.UserDto;
import com.noveltea.backend.service.AuthService;
import com.noveltea.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController extends BaseController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // Returns the full profile for the currently authenticated user.
    // Protected by SecurityConfig — requires a valid JWT (returns 401 if missing/invalid).
    @GetMapping("/me")
    public ResponseEntity<UserDto.Response> me(HttpServletRequest httpRequest) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(userService.getById(userId));
    }
}
