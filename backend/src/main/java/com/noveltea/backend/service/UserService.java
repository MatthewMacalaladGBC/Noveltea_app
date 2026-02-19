package com.noveltea.backend.service;

import com.noveltea.backend.dto.UserDto;
import com.noveltea.backend.model.User;
import com.noveltea.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserDto.Response getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return toResponse(user);
    }

    // PUT /users/{id} (admin-like / full update for allowed fields)
    public UserDto.Response updateUser(Long id, UserDto.UpdateRequest dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // For PUT, you can decide if you want to force all fields present.
        // Keeping it safe: update only fields provided.
        if (dto.getUsername() != null) user.setUsername(dto.getUsername());
        if (dto.getBio() != null) user.setBio(dto.getBio());
        if (dto.getPrivacy() != null) user.setPrivacy(dto.getPrivacy());

        return toResponse(userRepository.save(user));
    }

    // PATCH /users/profile (JWT user)
    public UserDto.Response updateMyProfile(String userIdFromJwt, UserDto.UpdateRequest dto) {
        Long userId = Long.parseLong(userIdFromJwt);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getUsername() != null) user.setUsername(dto.getUsername());
        if (dto.getBio() != null) user.setBio(dto.getBio());
        if (dto.getPrivacy() != null) user.setPrivacy(dto.getPrivacy());

        return toResponse(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
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