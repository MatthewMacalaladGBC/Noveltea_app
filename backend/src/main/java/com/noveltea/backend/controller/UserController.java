package com.noveltea.backend.controller;

import com.noveltea.backend.dto.UserDto;
import com.noveltea.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    // PUT /users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<UserDto.Response> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserDto.UpdateRequest dto
    ) {
        return ResponseEntity.ok(userService.updateUser(id, dto));
    }

    // PATCH /users/profile  (JWT user)
    @PatchMapping("/profile")
    public ResponseEntity<UserDto.Response> updateMyProfile(
            @RequestBody UserDto.UpdateRequest dto,
            HttpServletRequest request
    ) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userService.updateMyProfile(userId, dto));
    }

    // DELETE /users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
}
