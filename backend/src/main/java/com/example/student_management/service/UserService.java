package com.example.student_management.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.student_management.User;
import com.example.student_management.Exception.DuplicateResourceException;
import com.example.student_management.Exception.InvalidCredentialsException;
import com.example.student_management.dto.RegisterRequest;
import com.example.student_management.dto.UserResponse;
import com.example.student_management.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // Registration
    // New accounts are always USER, so clients cannot make themselves ADMIN
    public UserResponse registerUser(RegisterRequest request) {
        String username = request.username().trim();

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username '" + username + "' is already taken");
        }

        User user = new User(username, passwordEncoder.encode(request.password()), "USER");
        return UserResponse.from(userRepository.save(user));
    }

    // Login
    // Same message for unknown user and wrong password, so attackers can't tell them apart.
    public String loginUser(String username, String password) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        return jwtService.generateToken(
                user.getUsername(),
                user.getRole());
    }
}
