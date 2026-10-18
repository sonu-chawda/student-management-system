package com.example.student_management.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.student_management.Student;
import com.example.student_management.Exception.DuplicateResourceException;
import com.example.student_management.Exception.StudentNotFoundException;
import com.example.student_management.dto.CountByLabel;
import com.example.student_management.dto.PageResponse;
import com.example.student_management.dto.StudentRequest;
import com.example.student_management.dto.StudentResponse;
import com.example.student_management.dto.StudentStats;
import com.example.student_management.enums.StudentStatus;
import com.example.student_management.repository.StudentRepository;

import jakarta.persistence.criteria.Predicate;

@Service
@Transactional(readOnly = true)
public class StudentService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("id", "name", "age", "course", "email", "cgpa", "status", "enrollmentDate");

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    // ---------------------------------------------------------------- CRUD

    @Transactional
    public StudentResponse saveStudent(StudentRequest request) {
        String email = normalizeEmail(request.email());
        if (studentRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("A student with email " + email + " already exists");
        }
        Student student = new Student();
        applyRequest(student, request);
        return StudentResponse.from(studentRepository.save(student));
    }

    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll(Sort.by("id")).stream()
                .map(StudentResponse::from)
                .toList();
    }

    public StudentResponse getStudentById(Integer id) {
        return StudentResponse.from(findOrThrow(id));
    }

    @Transactional
    public void deleteStudent(Integer id) {
        if (!studentRepository.existsById(id)) {
            throw new StudentNotFoundException("Student not found with id: " + id);
        }
        studentRepository.deleteById(id);
    }

    @Transactional
    public StudentResponse updateStudent(Integer id, StudentRequest request) {
        Student student = findOrThrow(id);
        String email = normalizeEmail(request.email());
        if (studentRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new DuplicateResourceException("A student with email " + email + " already exists");
        }
        applyRequest(student, request);
        return StudentResponse.from(studentRepository.save(student));
    }

    // ------------------------------------------------- search / pagination

    public PageResponse<StudentResponse> searchStudents(
            String search, String course, StudentStatus status,
            int page, int size, String sortBy, String direction) {

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                buildSort(sortBy, direction));

        Page<StudentResponse> result = studentRepository
                .findAll(buildSpecification(search, course, status), pageable)
                .map(StudentResponse::from);

        return PageResponse.of(result);
    }

    public List<String> getCourses() {
        return studentRepository.findDistinctCourses();
    }

    // ------------------------------------------------------------ CSV export

    public String exportCsv(String search, String course, StudentStatus status,
                            String sortBy, String direction) {

        List<Student> students = studentRepository.findAll(
                buildSpecification(search, course, status),
                buildSort(sortBy, direction));

        StringBuilder csv = new StringBuilder(
                "ID,Name,Age,Course,Email,Phone,Gender,Status,CGPA,Enrollment Date\n");
        for (Student s : students) {
            csv.append(String.join(",",
                    cell(s.getId()),
                    cell(s.getName()),
                    cell(s.getAge()),
                    cell(s.getCourse()),
                    cell(s.getEmail()),
                    cell(s.getPhone()),
                    cell(s.getGender()),
                    cell(s.getStatus() != null ? s.getStatus() : StudentStatus.ACTIVE),
                    cell(s.getCgpa()),
                    cell(s.getEnrollmentDate()))).append('\n');
        }
        return csv.toString();
    }

    // ------------------------------------------------------------- dashboard

    public StudentStats getStats() {
        List<CountByLabel> courses = toCounts(studentRepository.groupByCourse());
        List<CountByLabel> statuses = toCounts(studentRepository.groupByStatus());
        List<CountByLabel> genders = toCounts(studentRepository.groupByGender());

        YearMonth thisMonth = YearMonth.now();
        List<LocalDate> enrollments =
                studentRepository.enrollmentDatesSince(thisMonth.minusMonths(5).atDay(1));

        // last 6 months, oldest first, months with no enrollments show 0
        Map<YearMonth, Long> trend = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            trend.put(thisMonth.minusMonths(i), 0L);
        }
        for (LocalDate d : enrollments) {
            trend.computeIfPresent(YearMonth.from(d), (k, v) -> v + 1);
        }
        List<CountByLabel> enrollmentTrend = trend.entrySet().stream()
                .map(e -> new CountByLabel(e.getKey().toString(), e.getValue()))
                .toList();

        long newThisMonth = trend.getOrDefault(thisMonth, 0L);

        return new StudentStats(
                studentRepository.count(),
                studentRepository.countByStatus(StudentStatus.ACTIVE),
                studentRepository.countByStatus(StudentStatus.INACTIVE),
                studentRepository.countByStatus(StudentStatus.GRADUATED),
                courses.size(),
                round(studentRepository.averageAge(), 1),
                round(studentRepository.averageCgpa(), 2),
                newThisMonth,
                courses,
                statuses,
                genders,
                enrollmentTrend);
    }

    // --------------------------------------------------------------- helpers

    private Student findOrThrow(Integer id) {
        return studentRepository.findById(id).orElseThrow(() ->
                new StudentNotFoundException("Student not found with id: " + id));
    }

    private void applyRequest(Student student, StudentRequest r) {
        student.setName(r.name().trim());
        student.setAge(r.age());
        student.setCourse(r.course().trim());
        student.setEmail(normalizeEmail(r.email()));
        student.setPhone(r.phone() == null || r.phone().isBlank() ? null : r.phone().trim());
        student.setGender(r.gender());
        student.setCgpa(r.cgpa());

        if (r.status() != null) {
            student.setStatus(r.status());
        } else if (student.getStatus() == null) {
            student.setStatus(StudentStatus.ACTIVE);
        }
        if (r.enrollmentDate() != null) {
            student.setEnrollmentDate(r.enrollmentDate());
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private Sort buildSort(String sortBy, String direction) {
        String field = SORTABLE_FIELDS.contains(sortBy) ? sortBy : "id";
        Sort.Direction dir = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(dir, field);
        // secondary key keeps pagination stable when many rows share a value
        return "id".equals(field) ? sort : sort.and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private Specification<Student> buildSpecification(String search, String course, StudentStatus status) {
        Specification<Student> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.<String>get("name")), like),
                        cb.like(cb.lower(root.<String>get("email")), like),
                        cb.like(cb.lower(root.<String>get("course")), like)));
            }
            if (course != null && !course.isBlank()) {
                predicates.add(cb.equal(root.get("course"), course.trim()));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return spec;
    }

    private List<CountByLabel> toCounts(List<Object[]> rows) {
        return rows.stream()
                .map(r -> new CountByLabel(String.valueOf(r[0]), ((Number) r[1]).longValue()))
                .toList();
    }

    private double round(Double value, int decimals) {
        if (value == null) {
            return 0;
        }
        double factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /** Escapes one CSV cell and neutralises spreadsheet formula injection. */
    private String cell(Object value) {
        if (value == null) {
            return "";
        }
        String text = String.valueOf(value);
        if (!text.isEmpty() && "=+-@".indexOf(text.charAt(0)) >= 0 && !(value instanceof Number)) {
            text = "'" + text;
        }
        if (text.contains(",") || text.contains("\"") || text.contains("\n")) {
            text = "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }
}
