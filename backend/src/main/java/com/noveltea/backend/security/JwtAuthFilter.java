package com.noveltea.backend.security;

import com.noveltea.backend.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // If something already authenticated this request, don’t re-do it
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        // No token -> continue (user stays unauthenticated)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();

        try {
            Claims claims = jwtService.parseToken(token);

            String userId = claims.getSubject(); // subject = userId
            String email = claims.get("email", String.class);

            // principal = email (so authentication.getName() returns email)
            var authentication = new UsernamePasswordAuthenticationToken(
                    email,
                    null,
                    Collections.emptyList()
    );

            // standard request details (IP, session id, etc.)
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // store userId somewhere safe for controllers/services
            request.setAttribute("userId", userId);

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
        }


        filterChain.doFilter(request, response);
    }
}
