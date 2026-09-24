import assert from "node:assert/strict";
import crypto from "node:crypto";

import db from "../src/database/db.js";

import {
    createNewLesson,
    getLesson,
    getLessons,
    getLessonsByModule,
    editLesson,
    removeLesson
} from "../src/services/lessonService.js";

const courseId = crypto.randomUUID();
const moduleId = crypto.randomUUID();

db.prepare(`
    INSERT INTO courses (
        id,
        title,
        slug,
        description,
        difficulty,
        status
    )
    VALUES (?, ?, ?, ?, ?, ?)
`).run(
    courseId,
    "Lesson Foundation Test Course",
    `lesson-foundation-${courseId}`,
    "Temporary test course",
    "beginner",
    "draft"
);

db.prepare(`
    INSERT INTO course_modules (
        id,
        course_id,
        title,
        slug,
        description,
        position,
        status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
    moduleId,
    courseId,
    "HTML Fundamentals",
    `html-fundamentals-${moduleId}`,
    "Temporary test module",
    1,
    "draft"
);

try {
    console.log("===== CREATE ENHANCED LESSON =====");

    const created = createNewLesson(courseId, {
        title: "HTML Document Structure",
        description: "Learn the basic structure of an HTML document.",
        content: "# HTML Structure",
        moduleId,
        lessonType: "reading",
        isRequired: true,
        estimatedMinutes: 15,
        position: 1
    });

    assert.equal(created.course_id, courseId);
    assert.equal(created.module_id, moduleId);
    assert.equal(created.title, "HTML Document Structure");
    assert.equal(created.slug, "html-document-structure");
    assert.equal(created.lesson_type, "reading");
    assert.equal(created.is_required, 1);
    assert.equal(created.estimated_minutes, 15);
    assert.equal(created.position, 1);

    const lessonId = created.id;

    console.log("CREATE ENHANCED LESSON: PASS");

    console.log("===== GET LESSON =====");

    const found = getLesson(lessonId);

    assert.equal(found.id, lessonId);
    assert.equal(found.module_id, moduleId);

    console.log("GET LESSON: PASS");

    console.log("===== LIST COURSE LESSONS =====");

    const courseLessons = getLessons(courseId);

    assert.equal(courseLessons.length, 1);
    assert.equal(courseLessons[0].id, lessonId);

    console.log("LIST COURSE LESSONS: PASS");

    console.log("===== LIST MODULE LESSONS =====");

    const moduleLessons = getLessonsByModule(moduleId);

    assert.equal(moduleLessons.length, 1);
    assert.equal(moduleLessons[0].id, lessonId);

    console.log("LIST MODULE LESSONS: PASS");

    console.log("===== CREATE SECOND LESSON =====");

    const second = createNewLesson(courseId, {
        title: "HTML Elements",
        moduleId,
        lessonType: "interactive",
        isRequired: false,
        estimatedMinutes: 20
    });

    assert.equal(second.module_id, moduleId);
    assert.equal(second.lesson_type, "interactive");
    assert.equal(second.is_required, 0);
    assert.equal(second.estimated_minutes, 20);
    assert.equal(second.position, 2);

    console.log("CREATE SECOND LESSON: PASS");

    console.log("===== UPDATE LESSON =====");

    const updated = editLesson(lessonId, {
        title: "HTML Document Anatomy",
        lessonType: "video",
        isRequired: false,
        estimatedMinutes: 25
    });

    assert.equal(updated.title, "HTML Document Anatomy");
    assert.equal(updated.lesson_type, "video");
    assert.equal(updated.is_required, 0);
    assert.equal(updated.estimated_minutes, 25);

    console.log("UPDATE LESSON: PASS");

    console.log("===== INVALID LESSON TYPE =====");

    assert.throws(
        () => createNewLesson(courseId, {
            title: "Invalid Lesson",
            lessonType: "nonsense"
        }),
        error => error.code === "INVALID_LESSON_TYPE"
    );

    console.log("INVALID LESSON TYPE: PASS");

    console.log("===== INVALID ESTIMATED MINUTES =====");

    assert.throws(
        () => createNewLesson(courseId, {
            title: "Invalid Duration",
            estimatedMinutes: 0
        }),
        error => error.code === "INVALID_ESTIMATED_MINUTES"
    );

    console.log("INVALID ESTIMATED MINUTES: PASS");

    console.log("===== MODULE COURSE OWNERSHIP CHECK =====");

    const otherCourseId = crypto.randomUUID();

    db.prepare(`
        INSERT INTO courses (
            id,
            title,
            slug,
            difficulty,
            status
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(
        otherCourseId,
        "Other Course",
        `other-course-${otherCourseId}`,
        "beginner",
        "draft"
    );

    try {
        assert.throws(
            () => createNewLesson(otherCourseId, {
                title: "Wrong Module",
                moduleId
            }),
            error => error.code === "MODULE_COURSE_MISMATCH"
        );

        console.log("MODULE COURSE OWNERSHIP: PASS");
    } finally {
        db.prepare(`
            DELETE FROM courses
            WHERE id = ?
        `).run(otherCourseId);
    }

    console.log("===== REMOVE MODULE FROM LESSON =====");

    const detached = editLesson(lessonId, {
        moduleId: null
    });

    assert.equal(detached.module_id, null);

    console.log("REMOVE MODULE: PASS");

    console.log("===== DELETE LESSON =====");

    const deleted = removeLesson(lessonId);

    assert.equal(deleted.deleted, true);
    assert.equal(
        db.prepare(`
            SELECT id
            FROM lessons
            WHERE id = ?
        `).get(lessonId),
        undefined
    );

    console.log("DELETE LESSON: PASS");

    console.log();
    console.log("===== LESSON FOUNDATION TESTS PASSED =====");
} finally {
    db.prepare(`
        DELETE FROM courses
        WHERE id = ?
    `).run(courseId);
}
