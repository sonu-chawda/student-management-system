package com.example.student_management.dto;

/** One bar / slice in a chart, e.g. ("B.Tech CSE", 12). */
public record CountByLabel(String label, long count) {
}
