import crypto from "node:crypto";
import db from "../src/database/db.js";
import {
    enroll,
    getCourseProgress,
    markLessonProgress
} from "../src/services/learningProgressService.js";

const userId = crypto.randomUUID();
const courseId = crypto.randomUUID();
const lesson1Id = crypto.randomUUID();
const lesson2Id = crypto.randomUUID();

function assert(condition, message) {
    if (!condition) {
        throw new Error(`FAIL: ${message}`);
    }

    console.log(`PASS: ${message}`);
}

try {
    console.log("============================================================");
    console.log("CODEM LEARNING COMPLETION TEST");
    console.log("============================================================");

    db.prepare(`
        INSERT INTO users (
            id,
            email,
            username,
            password_hash
        )
        VALUES (?, ?, ?, ?)
    `).run(
        userId,
        `learning-${userId}@test.local`,
        `learning_${userId.slice(0, 8)}`,
        "test-hash"
    );

    db.prepare(`
        INSERT INTO courses (
            id,
            title,
            slug,
            description,
            difficulty,
            status
        )
        VALUES (?, ?, ?, ?, 'beginner', 'published')
    `).run(
        courseId,
        "Learning Completion Test",
        `learning-completion-${userId.slice(0, 8)}`,
        "Temporary course"
    );

    db.prepare(`
        INSERT INTO lessons (
            id,
            course_id,
            title,
            slug,
            content,
            position
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        lesson1Id,
        courseId,
        "Lesson One",
        "lesson-one",
        "Temporary lesson",
        1
    );

    db.prepare(`
        INSERT INTO lessons (
            id,
            course_id,
            title,
            slug,
            content,
            position
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        lesson2Id,
        courseId,
        "Lesson Two",
        "lesson-two",
        "Temporary lesson",
        2
    );

    const enrollment = enroll(userId, courseId);

    assert(
        enrollment?.status === "active",
        "Course enrollment starts active"
    );

    let progress = getCourseProgress(userId, courseId);

    assert(
        progress.totalLessons === 2 &&
        progress.completedLessons === 0 &&
        progress.percentage === 0,
        "New enrollment reports 0% progress"
    );

    markLessonProgress(userId, lesson1Id, false);

    const lesson1Started = db.prepare(`
        SELECT status, progress_percent, started_at, completed_at
        FROM lesson_progress
        WHERE user_id = ? AND lesson_id = ?
    `).get(userId, lesson1Id);

    assert(
        lesson1Started.status === "in_progress" &&
        lesson1Started.progress_percent === 0 &&
        lesson1Started.started_at !== null &&
        lesson1Started.completed_at === null,
        "Incomplete lesson is stored as in_progress"
    );

    markLessonProgress(userId, lesson1Id, true);

    progress = getCourseProgress(userId, courseId);

    assert(
        progress.totalLessons === 2 &&
        progress.completedLessons === 1 &&
        progress.percentage === 50,
        "Completing first lesson produces 50% progress"
    );

    const activeEnrollment = db.prepare(`
        SELECT status, completed_at
        FROM enrollments
        WHERE user_id = ? AND course_id = ?
    `).get(userId, courseId);

    assert(
        activeEnrollment.status === "active" &&
        activeEnrollment.completed_at === null,
        "Enrollment remains active before all lessons are complete"
    );

    markLessonProgress(userId, lesson2Id, true);

    progress = getCourseProgress(userId, courseId);

    assert(
        progress.totalLessons === 2 &&
        progress.completedLessons === 2 &&
        progress.percentage === 100,
        "Completing all lessons produces 100% progress"
    );

    const completedEnrollment = db.prepare(`
        SELECT status, completed_at
        FROM enrollments
        WHERE user_id = ? AND course_id = ?
    `).get(userId, courseId);

    assert(
        completedEnrollment.status === "completed" &&
        completedEnrollment.completed_at !== null,
        "Enrollment becomes completed at 100%"
    );

    markLessonProgress(userId, lesson2Id, false);

    progress = getCourseProgress(userId, courseId);

    assert(
        progress.completedLessons === 1 &&
        progress.percentage === 50,
        "Reverting a lesson reduces course progress"
    );

    const reopenedEnrollment = db.prepare(`
        SELECT status, completed_at
        FROM enrollments
        WHERE user_id = ? AND course_id = ?
    `).get(userId, courseId);

    assert(
        reopenedEnrollment.status === "active" &&
        reopenedEnrollment.completed_at === null,
        "Enrollment reopens when course is no longer complete"
    );

    console.log("============================================================");
    console.log("RESULT");
    console.log("============================================================");
    console.log("PASS: LEARNING COMPLETION LIFECYCLE");
} finally {
    db.prepare(`
        DELETE FROM users
        WHERE id = ?
    `).run(userId);

    db.prepare(`
        DELETE FROM courses
        WHERE id = ?
    `).run(courseId);

    console.log("Temporary learning test data removed.");
}
