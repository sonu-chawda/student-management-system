package com.example.student_management.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.student_management.Student;
import com.example.student_management.enums.StudentStatus;

public interface StudentRepository
        extends JpaRepository<Student, Integer>, JpaSpecificationExecutor<Student> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Integer id);

    long countByStatus(StudentStatus status);

    @Query("select s.course, count(s) from Student s group by s.course order by count(s) desc")
    List<Object[]> groupByCourse();

    @Query("select s.status, count(s) from Student s where s.status is not null group by s.status")
    List<Object[]> groupByStatus();

    @Query("select s.gender, count(s) from Student s where s.gender is not null group by s.gender")
    List<Object[]> groupByGender();

    @Query("select avg(s.age) from Student s")
    Double averageAge();

    @Query("select avg(s.cgpa) from Student s")
    Double averageCgpa();

    @Query("select s.enrollmentDate from Student s where s.enrollmentDate >= :from")
    List<LocalDate> enrollmentDatesSince(@Param("from") LocalDate from);

    @Query("select distinct s.course from Student s where s.course is not null order by s.course")
    List<String> findDistinctCourses();
}
