package com.example.student_management.controller;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.student_management.dto.PageResponse;
import com.example.student_management.dto.StudentRequest;
import com.example.student_management.dto.StudentResponse;
import com.example.student_management.dto.StudentStats;
import com.example.student_management.enums.StudentStatus;
import com.example.student_management.service.StudentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@Tag(name = "Students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping("/students")
    @Operation(summary = "Add a new student")
    public ResponseEntity<StudentResponse> addStudent(@Valid @RequestBody StudentRequest request) {
        StudentResponse created = studentService.saveStudent(request);
        return ResponseEntity.created(URI.create("/students/" + created.id())).body(created);
    }

    @GetMapping("/students")
    @Operation(summary = "List every student (no pagination)")
    public List<StudentResponse> getAllStudents() {
        return studentService.getAllStudents();
    }

    @GetMapping("/students/search")
    @Operation(summary = "Search, filter, sort and paginate students")
    public PageResponse<StudentResponse> searchStudents(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "course", required = false) String course,
            @RequestParam(name = "status", required = false) StudentStatus status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "direction", defaultValue = "asc") String direction) {

        return studentService.searchStudents(search, course, status, page, size, sortBy, direction);
    }

    @GetMapping("/students/stats")
    @Operation(summary = "Dashboard statistics (totals, averages, chart data)")
    public StudentStats getStats() {
        return studentService.getStats();
    }

    @GetMapping("/students/courses")
    @Operation(summary = "Distinct course names (for filter dropdowns)")
    public List<String> getCourses() {
        return studentService.getCourses();
    }

    @GetMapping("/students/export")
    @Operation(summary = "Download students as a CSV file (same filters as /students/search)")
    public ResponseEntity<byte[]> exportStudents(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "course", required = false) String course,
            @RequestParam(name = "status", required = false) StudentStatus status,
            @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(name = "direction", defaultValue = "asc") String direction) {

        String csv = studentService.exportCsv(search, course, status, sortBy, direction);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("students.csv").build().toString())
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping("/students/{id}")
    @Operation(summary = "Get one student by id")
    public StudentResponse getStudentById(@PathVariable Integer id) {
        return studentService.getStudentById(id);
    }

    @PutMapping("/students/{id}")
    @Operation(summary = "Update a student")
    public StudentResponse updateStudent(
            @PathVariable Integer id,
            @Valid @RequestBody StudentRequest request) {

        return studentService.updateStudent(id, request);
    }

    @DeleteMapping("/students/{id}")
    @Operation(summary = "Delete a student (ADMIN only)")
    public ResponseEntity<Void> deleteStudent(@PathVariable Integer id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}
