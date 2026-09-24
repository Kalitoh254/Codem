import assert from "node:assert/strict";
import crypto from "node:crypto";

import db from "../src/database/db.js";

import {
    createNewCourse,
    getCourse,
    getCourses,
    editCourse,
    removeCourse
} from "../src/services/courseService.js";

const testSlug = `course-foundation-${crypto.randomUUID()}`;

let courseId;

try {
    console.log("===== CREATE ENHANCED COURSE =====");

    const course = createNewCourse({
        title: "Web Development Fundamentals",
        description: "Learn the foundations of modern web development.",
        category: "Web Development",
        difficulty: "beginner",
        status: "draft",
        durationMinutes: 480,
        prerequisites: [
            "Basic computer literacy"
        ],
        learningOutcomes: [
            "Understand HTML",
            "Understand CSS",
            "Build basic web pages"
        ],
        slug: testSlug
    });

    courseId = course.id;

    assert.equal(course.title, "Web Development Fundamentals");
    assert.equal(course.slug, testSlug);
    assert.equal(course.category, "Web Development");
    assert.equal(course.difficulty, "beginner");
    assert.equal(course.status, "draft");
    assert.equal(course.duration_minutes, 480);
    assert.deepEqual(
        JSON.parse(course.prerequisites),
        ["Basic computer literacy"]
    );
    assert.deepEqual(
        JSON.parse(course.learning_outcomes),
        [
            "Understand HTML",
            "Understand CSS",
            "Build basic web pages"
        ]
    );

    console.log("CREATE ENHANCED COURSE: PASS");

    console.log("===== GET COURSE =====");

    const found = getCourse(courseId);

    assert.equal(found.id, courseId);
    assert.equal(found.category, "Web Development");
    assert.equal(found.duration_minutes, 480);

    console.log("GET COURSE: PASS");

    console.log("===== LIST COURSES WITH CATEGORY =====");

    const listed = getCourses({
        category: "Web Development",
        status: "draft"
    });

    assert.ok(
        listed.courses.some(
            item => item.id === courseId
        )
    );

    assert.ok(
        listed.pagination.total >= 1
    );

    console.log("LIST COURSES: PASS");

    console.log("===== UPDATE COURSE METADATA =====");

    const updated = editCourse(courseId, {
        title: "Modern Web Development Fundamentals",
        category: "Software Development",
        difficulty: "intermediate",
        durationMinutes: 600,
        prerequisites: [
            "Basic computer literacy",
            "Basic command-line knowledge"
        ],
        learningOutcomes: [
            "Build structured web pages",
            "Style responsive interfaces"
        ]
    });

    assert.equal(
        updated.title,
        "Modern Web Development Fundamentals"
    );

    assert.equal(
        updated.category,
        "Software Development"
    );

    assert.equal(
        updated.difficulty,
        "intermediate"
    );

    assert.equal(
        updated.duration_minutes,
        600
    );

    assert.deepEqual(
        JSON.parse(updated.prerequisites),
        [
            "Basic computer literacy",
            "Basic command-line knowledge"
        ]
    );

    assert.deepEqual(
        JSON.parse(updated.learning_outcomes),
        [
            "Build structured web pages",
            "Style responsive interfaces"
        ]
    );

    console.log("UPDATE COURSE METADATA: PASS");

    console.log("===== INVALID DIFFICULTY =====");

    assert.throws(
        () => createNewCourse({
            title: "Invalid Difficulty Course",
            difficulty: "expert"
        }),
        error =>
            error.code === "INVALID_COURSE_DIFFICULTY"
    );

    console.log("INVALID DIFFICULTY: PASS");

    console.log("===== INVALID STATUS =====");

    assert.throws(
        () => createNewCourse({
            title: "Invalid Status Course",
            status: "live"
        }),
        error =>
            error.code === "INVALID_COURSE_STATUS"
    );

    console.log("INVALID STATUS: PASS");

    console.log("===== INVALID DURATION =====");

    assert.throws(
        () => createNewCourse({
            title: "Invalid Duration Course",
            durationMinutes: 0
        }),
        error =>
            error.code === "INVALID_COURSE_DURATION"
    );

    console.log("INVALID DURATION: PASS");

    console.log("===== INVALID PREREQUISITES =====");

    assert.throws(
        () => createNewCourse({
            title: "Invalid Prerequisites Course",
            prerequisites: "not-an-array"
        }),
        error =>
            error.code === "INVALID_PREREQUISITES"
    );

    console.log("INVALID PREREQUISITES: PASS");

    console.log("===== INVALID LEARNING OUTCOMES =====");

    assert.throws(
        () => createNewCourse({
            title: "Invalid Outcomes Course",
            learningOutcomes: "not-an-array"
        }),
        error =>
            error.code === "INVALID_LEARNINGOUTCOMES"
    );

    console.log("INVALID LEARNING OUTCOMES: PASS");

    console.log("===== DUPLICATE SLUG =====");

    assert.throws(
        () => createNewCourse({
            title: "Duplicate Slug Course",
            slug: testSlug
        }),
        error =>
            error.code === "COURSE_SLUG_EXISTS"
    );

    console.log("DUPLICATE SLUG: PASS");

    console.log("===== REMOVE COURSE =====");

    const deleted = removeCourse(courseId);

    assert.equal(deleted.deleted, true);

    assert.equal(
        db.prepare(`
            SELECT id
            FROM courses
            WHERE id = ?
        `).get(courseId),
        undefined
    );

    courseId = null;

    console.log("REMOVE COURSE: PASS");

    console.log();
    console.log("===== COURSE FOUNDATION TESTS PASSED =====");
} finally {
    if (courseId) {
        db.prepare(`
            DELETE FROM courses
            WHERE id = ?
        `).run(courseId);
    }
}
