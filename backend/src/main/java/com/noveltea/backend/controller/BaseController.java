package com.noveltea.backend.controller;

import jakarta.servlet.http.HttpServletRequest;

public abstract class BaseController {

    protected Long getUserId(HttpServletRequest request) {
        Object value = request.getAttribute("userId");
        if (value == null) return null;

        if (value instanceof Long) return (Long) value;

        // JwtAuthFilter stores it as String right now
        return Long.parseLong(value.toString());
    }
}
