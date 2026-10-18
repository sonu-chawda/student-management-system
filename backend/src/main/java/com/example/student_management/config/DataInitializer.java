package com.example.student_management.config;

import java.time.LocalDate;
import java.util.List;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.student_management.Student;
import com.example.student_management.User;
import com.example.student_management.enums.Gender;
import com.example.student_management.enums.StudentStatus;
import com.example.student_management.repository.StudentRepository;
import com.example.student_management.repository.UserRepository;

/**
 * Runs once at startup:
 *  1. creates the first ADMIN account (credentials come from configuration),
 *  2. fills in the status of students saved before the status field existed,
 *  3. inserts demo students when the table is empty (SEED_DEMO_DATA=true).
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    // name, gender (M/F), course
    private static final String[][] DEMO = {
            {"Aarav Sharma", "M", "B.Tech CSE"}, {"Priya Verma", "F", "BCA"},
            {"Rohan Gupta", "M", "B.Tech ECE"}, {"Ananya Singh", "F", "MBA"},
            {"Vikram Patel", "M", "B.Tech Mechanical"}, {"Neha Yadav", "F", "B.Sc Physics"},
            {"Arjun Mishra", "M", "B.Tech CSE"}, {"Kavya Nair", "F", "MCA"},
            {"Rahul Dubey", "M", "B.Com"}, {"Sneha Joshi", "F", "B.Tech CSE"},
            {"Aditya Tiwari", "M", "BCA"}, {"Pooja Chauhan", "F", "MBA"},
            {"Karan Mehta", "M", "B.Tech ECE"}, {"Isha Agarwal", "F", "B.Com"},
            {"Siddharth Rao", "M", "B.Tech CSE"}, {"Riya Kapoor", "F", "B.Sc Physics"},
            {"Manish Pandey", "M", "MCA"}, {"Divya Reddy", "F", "B.Tech CSE"},
            {"Harsh Jain", "M", "B.Tech Mechanical"}, {"Simran Kaur", "F", "BCA"},
            {"Yash Soni", "M", "MBA"}, {"Meera Iyer", "F", "B.Tech ECE"},
            {"Nikhil Saxena", "M", "B.Tech CSE"}, {"Tanvi Deshmukh", "F", "B.Com"}
    };

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String adminPassword;
    private final boolean seedDemoData;

    public DataInitializer(UserRepository userRepository,
                           StudentRepository studentRepository,
                           PasswordEncoder passwordEncoder,
                           @Value("${app.admin.username}") String adminUsername,
                           @Value("${app.admin.password}") String adminPassword,
                           @Value("${app.seed-demo-data}") boolean seedDemoData) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.seedDemoData = seedDemoData;
    }

    @Override
    public void run(String... args) {
        createAdminIfMissing();
        backfillLegacyStudents();
        if (seedDemoData && studentRepository.count() == 0) {
            seedStudents();
        }
    }

    private void createAdminIfMissing() {
        if (!userRepository.existsByUsername(adminUsername)) {
            userRepository.save(new User(adminUsername, passwordEncoder.encode(adminPassword), "ADMIN"));
            log.info("Created admin user '{}'. Change its password before deploying anywhere public.",
                    adminUsername);
        }
    }

    private void backfillLegacyStudents() {
        List<Student> legacy = studentRepository.findAll().stream()
                .filter(s -> s.getStatus() == null)
                .toList();
        if (!legacy.isEmpty()) {
            legacy.forEach(s -> s.setStatus(StudentStatus.ACTIVE));
            studentRepository.saveAll(legacy);
            log.info("Set status ACTIVE on {} existing students", legacy.size());
        }
    }

    private void seedStudents() {
        Random random = new Random(7);
        StudentStatus[] statuses = {
                StudentStatus.ACTIVE, StudentStatus.ACTIVE, StudentStatus.ACTIVE, StudentStatus.ACTIVE,
                StudentStatus.INACTIVE, StudentStatus.GRADUATED};

        for (String[] row : DEMO) {
            Student s = new Student();
            s.setName(row[0]);
            s.setGender("M".equals(row[1]) ? Gender.MALE : Gender.FEMALE);
            s.setCourse(row[2]);
            s.setAge(18 + random.nextInt(9));
            s.setEmail(row[0].toLowerCase().replace(' ', '.') + "@example.com");
            s.setPhone("98765" + (10000 + random.nextInt(90000)));
            s.setCgpa(Math.round((6.0 + random.nextDouble() * 3.8) * 10) / 10.0);
            s.setStatus(statuses[random.nextInt(statuses.length)]);
            s.setEnrollmentDate(LocalDate.now().minusDays(random.nextInt(170)));
            studentRepository.save(s);
        }
        log.info("Inserted {} demo students", DEMO.length);
    }
}
