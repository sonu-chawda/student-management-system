package com.example.student_management.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import io.jsonwebtoken.JwtException;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "unit-test-secret-key-with-more-than-32-chars");
        ReflectionTestUtils.setField(jwtService, "expiration", 60_000L);
    }

    @Test
    void generatedToken_containsUsernameAndRole() {
        String token = jwtService.generateToken("ravi", "ADMIN");

        assertEquals("ravi", jwtService.extractUsername(token));
        assertEquals("ADMIN", jwtService.extractRole(token));
    }

    @Test
    void tamperedToken_isRejected() {
        String token = jwtService.generateToken("ravi", "USER");

        assertThrows(JwtException.class, () -> jwtService.extractUsername(token + "x"));
    }

    @Test
    void expiredToken_isRejected() {
        ReflectionTestUtils.setField(jwtService, "expiration", -1000L);
        String token = jwtService.generateToken("ravi", "USER");

        assertThrows(JwtException.class, () -> jwtService.extractUsername(token));
    }
}
