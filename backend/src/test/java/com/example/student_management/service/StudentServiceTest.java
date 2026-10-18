package com.example.student_management.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.student_management.Student;
import com.example.student_management.Exception.DuplicateResourceException;
import com.example.student_management.Exception.StudentNotFoundException;
import com.example.student_management.dto.StudentRequest;
import com.example.student_management.dto.StudentResponse;
import com.example.student_management.dto.StudentStats;
import com.example.student_management.enums.StudentStatus;
import com.example.student_management.repository.StudentRepository;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private StudentService studentService;

    private StudentRequest request(String email) {
        return new StudentRequest("  Aarav Sharma ", 20, "B.Tech CSE", email,
                null, null, null, 8.5, null);
    }

    @Test
    void saveStudent_trimsAndLowercasesAndDefaultsStatus() {
        when(studentRepository.existsByEmailIgnoreCase("aarav@example.com")).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId(1);
            return s;
        });

        StudentResponse response = studentService.saveStudent(request(" Aarav@Example.com "));

        assertEquals(1, response.id());
        assertEquals("Aarav Sharma", response.name());
        assertEquals("aarav@example.com", response.email());
        assertEquals(StudentStatus.ACTIVE, response.status());
    }

    @Test
    void saveStudent_duplicateEmail_throwsConflict() {
        when(studentRepository.existsByEmailIgnoreCase("aarav@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> studentService.saveStudent(request("aarav@example.com")));
        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    void getStudentById_missing_throwsNotFound() {
        when(studentRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(StudentNotFoundException.class, () -> studentService.getStudentById(99));
    }

    @Test
    void deleteStudent_missing_throwsNotFound() {
        when(studentRepository.existsById(5)).thenReturn(false);

        assertThrows(StudentNotFoundException.class, () -> studentService.deleteStudent(5));
        verify(studentRepository, never()).deleteById(5);
    }

    @Test
    void deleteStudent_existing_deletes() {
        when(studentRepository.existsById(5)).thenReturn(true);

        studentService.deleteStudent(5);

        verify(studentRepository).deleteById(5);
    }

    @Test
    void updateStudent_changesFieldsAndKeepsStatusWhenNotSent() {
        Student existing = new Student();
        existing.setId(3);
        existing.setName("Old Name");
        existing.setStatus(StudentStatus.GRADUATED);

        when(studentRepository.findById(3)).thenReturn(Optional.of(existing));
        when(studentRepository.existsByEmailIgnoreCaseAndIdNot("aarav@example.com", 3)).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        StudentResponse response = studentService.updateStudent(3, request("aarav@example.com"));

        assertEquals(3, response.id());
        assertEquals("Aarav Sharma", response.name());
        assertEquals(StudentStatus.GRADUATED, response.status());
    }

    @Test
    void getStats_buildsCountsAndRoundsAverages() {
        when(studentRepository.count()).thenReturn(10L);
        when(studentRepository.countByStatus(StudentStatus.ACTIVE)).thenReturn(7L);
        when(studentRepository.groupByCourse())
                .thenReturn(List.of(new Object[] {"BCA", 6L}, new Object[] {"MBA", 4L}));
        when(studentRepository.averageAge()).thenReturn(20.46);

        StudentStats stats = studentService.getStats();

        assertEquals(10, stats.totalStudents());
        assertEquals(7, stats.activeStudents());
        assertEquals(2, stats.totalCourses());
        assertEquals(20.5, stats.averageAge());
        assertEquals("BCA", stats.courseDistribution().get(0).label());
        assertEquals(6, stats.enrollmentTrend().size());
    }
}
