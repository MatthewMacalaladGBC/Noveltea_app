package com.noveltea.backend.service;

import com.noveltea.backend.dto.AuthResponse;
import com.noveltea.backend.dto.LoginRequest;
import com.noveltea.backend.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
