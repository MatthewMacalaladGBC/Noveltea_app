package com.noveltea.backend.service;

import com.noveltea.backend.dto.UserDto;
import com.noveltea.backend.exception.ForbiddenException;
import com.noveltea.backend.exception.ResourceNotFoundException;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // GET /users/{id} — public read, no ownership check needed
    public UserDto.Response getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        return toResponse(user);
    }

    // PUT /users/{id} — user themselves or an admin can update a profile
    public UserDto.Response updateUser(Long requestingUserId, Long targetId, UserDto.UpdateRequest dto) {
        if (!requestingUserId.equals(targetId) && !isAdmin(requestingUserId)) {
            throw new ForbiddenException("Not authorized to update this user's profile.");
        }

        User user = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetId));

        if (dto.getUsername() != null) user.setUsername(dto.getUsername());
        if (dto.getBio() != null) user.setBio(dto.getBio());
        if (dto.getPrivacy() != null) user.setPrivacy(dto.getPrivacy());

        return toResponse(userRepository.save(user));
    }

    // PATCH /users/profile — self-service update via JWT identity
    public UserDto.Response updateMyProfile(Long userId, UserDto.UpdateRequest dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (dto.getUsername() != null) user.setUsername(dto.getUsername());
        if (dto.getBio() != null) user.setBio(dto.getBio());
        if (dto.getPrivacy() != null) user.setPrivacy(dto.getPrivacy());

        return toResponse(userRepository.save(user));
    }

    // DELETE /users/{id} — user themselves or an admin can delete an account
    public void deleteUser(Long requestingUserId, Long targetId) {
        if (!requestingUserId.equals(targetId) && !isAdmin(requestingUserId)) {
            throw new ForbiddenException("Not authorized to delete this user's account.");
        }

        if (!userRepository.existsById(targetId)) {
            throw new ResourceNotFoundException("User not found: " + targetId);
        }

        userRepository.deleteById(targetId);
    }

    private boolean isAdmin(Long userId) {
        return userRepository.findById(userId)
                .map(u -> "admin".equals(u.getRole()))
                .orElse(false);
    }

    private UserDto.Response toResponse(User user) {
        return UserDto.Response.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .bio(user.getBio())
                .privacy(user.getPrivacy())
                .role(user.getRole() == null ? null : user.getRole().toString())
                .joinDate(user.getJoinDate())
                .build();
    }
}