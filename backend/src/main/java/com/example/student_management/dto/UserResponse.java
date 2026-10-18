package com.example.student_management.dto;

import com.example.student_management.User;

/** Never exposes the password hash. */
public record UserResponse(Integer id, String username, String role) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getRole());
    }
}
