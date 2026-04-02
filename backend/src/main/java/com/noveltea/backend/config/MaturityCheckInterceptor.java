package com.noveltea.backend.config;

import java.time.LocalDate;
import java.time.Period;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.noveltea.backend.exception.AgeRestrictedException;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.UserRepository;
import com.noveltea.backend.service.MaturityCheckService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class MaturityCheckInterceptor implements HandlerInterceptor {

    @Autowired
    private MaturityCheckService maturityCheckService;

    @Autowired
    private UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        // Extract ISBN from URL (e.g. /api/books/9780142437247)
        String isbn = extractIsbn(request.getRequestURI());
        if (isbn == null) return true;

        // JwtAuthFilter already pulled userId from the token and stored it here
        String userIdStr = (String) request.getAttribute("userId");
        if (userIdStr == null) return true; // unauthenticated — let security handle it

        Long userId = Long.parseLong(userIdStr);

        // Look up the user to get their dateOfBirth
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return true;

        // Calculate age from dateOfBirth
        int age = Period.between(user.getDateOfBirth(), LocalDate.now()).getYears();

        // If under 18 and book is MATURE, throw the friendly block message
        if (maturityCheckService.isBlockedForUser(isbn, age)) {
            throw new AgeRestrictedException();
        }

        return true;
    }

    /**
     * Pulls the ISBN out of a URL like /api/books/9780142437247
     */
    private String extractIsbn(String path) {
        String[] segments = path.split("/");
        for (int i = 0; i < segments.length - 1; i++) {
            if (segments[i].equals("books")) {
                return segments[i + 1];
            }
        }
        return null;
    }
}