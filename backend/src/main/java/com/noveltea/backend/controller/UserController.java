package com.noveltea.backend.controller;

import com.noveltea.backend.dto.UserDto;
import com.noveltea.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController extends BaseController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    // PUT /users/{id} — caller can only update their own profile
    @PutMapping("/{id}")
    public ResponseEntity<UserDto.Response> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserDto.UpdateRequest dto,
            HttpServletRequest httpRequest
    ) {
        Long requestingUserId = getUserId(httpRequest);
        return ResponseEntity.ok(userService.updateUser(requestingUserId, id, dto));
    }

    // PATCH /users/profile — self-service update via JWT identity
    @PatchMapping("/profile")
    public ResponseEntity<UserDto.Response> updateMyProfile(
            @RequestBody UserDto.UpdateRequest dto,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserId(httpRequest);
        return ResponseEntity.ok(userService.updateMyProfile(userId, dto));
    }

    // DELETE /users/{id} — caller can only delete their own account
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long requestingUserId = getUserId(httpRequest);
        userService.deleteUser(requestingUserId, id);
        return ResponseEntity.noContent().build();
    }
}