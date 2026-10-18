package com.example.student_management.dto;

import java.time.LocalDate;

import com.example.student_management.enums.Gender;
import com.example.student_management.enums.StudentStatus;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Data accepted when creating or updating a student. */
public record StudentRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @NotNull(message = "Age is required")
        @Min(value = 1, message = "Age must be at least 1")
        @Max(value = 120, message = "Age must be at most 120")
        Integer age,

        @NotBlank(message = "Course is required")
        @Size(max = 100, message = "Course must be at most 100 characters")
        String course,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 150, message = "Email must be at most 150 characters")
        String email,

        @Pattern(regexp = "^$|^[0-9+()\\- ]{7,15}$", message = "Phone must be 7-15 digits")
        String phone,

        Gender gender,

        StudentStatus status,

        @DecimalMin(value = "0.0", message = "CGPA cannot be below 0")
        @DecimalMax(value = "10.0", message = "CGPA cannot be above 10")
        Double cgpa,

        LocalDate enrollmentDate) {
}
