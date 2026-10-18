package com.example.student_management.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.student_management.User;
import com.example.student_management.Exception.DuplicateResourceException;
import com.example.student_management.Exception.InvalidCredentialsException;
import com.example.student_management.dto.RegisterRequest;
import com.example.student_management.dto.UserResponse;
import com.example.student_management.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserService userService;

    @Test
    void register_alwaysCreatesUserRoleWithHashedPassword() {
        when(userRepository.existsByUsername("ravi")).thenReturn(false);
        when(passwordEncoder.encode("secret1")).thenReturn("HASHED");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.registerUser(new RegisterRequest("ravi", "secret1"));

        assertEquals("ravi", response.username());
        assertEquals("USER", response.role());
    }

    @Test
    void register_duplicateUsername_throwsConflict() {
        when(userRepository.existsByUsername("ravi")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> userService.registerUser(new RegisterRequest("ravi", "secret1")));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_validCredentials_returnsToken() {
        User user = new User("ravi", "HASHED", "ADMIN");
        when(userRepository.findByUsername("ravi")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret1", "HASHED")).thenReturn(true);
        when(jwtService.generateToken("ravi", "ADMIN")).thenReturn("TOKEN");

        assertEquals("TOKEN", userService.loginUser("ravi", "secret1"));
    }

    @Test
    void login_unknownUser_throwsInvalidCredentials() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> userService.loginUser("ghost", "x"));
    }

    @Test
    void login_wrongPassword_throwsInvalidCredentials() {
        User user = new User("ravi", "HASHED", "USER");
        when(userRepository.findByUsername("ravi")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "HASHED")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> userService.loginUser("ravi", "wrong"));
    }
}
