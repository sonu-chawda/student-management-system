package com.example.student_management.dto;

import java.util.List;

/** Numbers used by the dashboard cards and charts. */
public record StudentStats(
        long totalStudents,
        long activeStudents,
        long inactiveStudents,
        long graduatedStudents,
        long totalCourses,
        double averageAge,
        double averageCgpa,
        long newThisMonth,
        List<CountByLabel> courseDistribution,
        List<CountByLabel> statusDistribution,
        List<CountByLabel> genderDistribution,
        List<CountByLabel> enrollmentTrend) {
}
