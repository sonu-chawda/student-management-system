package com.example.student_management.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.example.student_management.Student;
import com.example.student_management.enums.Gender;
import com.example.student_management.enums.StudentStatus;

/** Student data sent back to the client. */
public record StudentResponse(
        Integer id,
        String name,
        int age,
        String course,
        String email,
        String phone,
        Gender gender,
        StudentStatus status,
        Double cgpa,
        LocalDate enrollmentDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static StudentResponse from(Student s) {
        return new StudentResponse(
                s.getId(),
                s.getName(),
                s.getAge(),
                s.getCourse(),
                s.getEmail(),
                s.getPhone(),
                s.getGender(),
                s.getStatus() != null ? s.getStatus() : StudentStatus.ACTIVE,
                s.getCgpa(),
                s.getEnrollmentDate(),
                s.getCreatedAt(),
                s.getUpdatedAt());
    }
}
