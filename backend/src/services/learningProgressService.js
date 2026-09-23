import crypto from "node:crypto";
import db from "../database/db.js";

function assertCourse(courseId) {
    const course = db.prepare(`
        SELECT id
        FROM courses
        WHERE id = ?
    `).get(courseId);

    if (!course) {
        throw Object.assign(
            new Error("Course not found."),
            { status: 404, code: "COURSE_NOT_FOUND" }
        );
    }

    return course;
}

function getLesson(lessonId) {
    const lesson = db.prepare(`
        SELECT id, course_id
        FROM lessons
        WHERE id = ?
    `).get(lessonId);

    if (!lesson) {
        throw Object.assign(
            new Error("Lesson not found."),
            { status: 404, code: "LESSON_NOT_FOUND" }
        );
    }

    return lesson;
}

function findEnrollment(userId, courseId) {
    return db.prepare(`
        SELECT *
        FROM enrollments
        WHERE user_id = ? AND course_id = ?
    `).get(userId, courseId) || null;
}

function synchronizeEnrollmentCompletion(userId, courseId) {
    const total = db.prepare(`
        SELECT COUNT(*) AS count
        FROM lessons
        WHERE course_id = ?
    `).get(courseId).count;

    const completed = db.prepare(`
        SELECT COUNT(*) AS count
        FROM lesson_progress lp
        JOIN lessons l ON l.id = lp.lesson_id
        WHERE lp.user_id = ?
          AND l.course_id = ?
          AND lp.status = 'completed'
    `).get(userId, courseId).count;

    const complete = total > 0 && completed === total;

    if (complete) {
        db.prepare(`
            UPDATE enrollments
            SET status = 'completed',
                completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
            WHERE user_id = ?
              AND course_id = ?
              AND status != 'cancelled'
        `).run(userId, courseId);
    } else {
        db.prepare(`
            UPDATE enrollments
            SET status = 'active',
                completed_at = NULL
            WHERE user_id = ?
              AND course_id = ?
              AND status = 'completed'
        `).run(userId, courseId);
    }

    return {
        totalLessons: total,
        completedLessons: completed,
        percentage: total
            ? Math.round((completed / total) * 100)
            : 0,
        completed: complete
    };
}

export function enroll(userId, courseId) {
    assertCourse(courseId);

    const existing = findEnrollment(userId, courseId);

    if (existing) {
        return existing;
    }

    const id = crypto.randomUUID();

    db.prepare(`
        INSERT INTO enrollments (
            id,
            user_id,
            course_id,
            enrolled_at,
            status
        )
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'active')
    `).run(id, userId, courseId);

    return findEnrollment(userId, courseId);
}

export function getEnrollment(userId, courseId) {
    assertCourse(courseId);
    return findEnrollment(userId, courseId);
}

export function markLessonProgress(
    userId,
    lessonId,
    completed = true
) {
    const lesson = getLesson(lessonId);

    const enrollment = findEnrollment(userId, lesson.course_id);

    if (!enrollment) {
        throw Object.assign(
            new Error("You must enroll in the course first."),
            { status: 403, code: "COURSE_NOT_ENROLLED" }
        );
    }

    if (enrollment.status === "cancelled") {
        throw Object.assign(
            new Error("This course enrollment has been cancelled."),
            { status: 403, code: "COURSE_ENROLLMENT_CANCELLED" }
        );
    }

    const isCompleted = completed === true;

    const existing = db.prepare(`
        SELECT *
        FROM lesson_progress
        WHERE user_id = ?
          AND lesson_id = ?
    `).get(userId, lessonId);

    if (existing) {
        db.prepare(`
            UPDATE lesson_progress
            SET status = ?,
                progress_percent = ?,
                started_at = COALESCE(
                    started_at,
                    CURRENT_TIMESTAMP
                ),
                completed_at = CASE
                    WHEN ? = 1 THEN COALESCE(
                        completed_at,
                        CURRENT_TIMESTAMP
                    )
                    ELSE NULL
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
              AND lesson_id = ?
        `).run(
            isCompleted ? "completed" : "in_progress",
            isCompleted ? 100 : 0,
            isCompleted ? 1 : 0,
            userId,
            lessonId
        );
    } else {
        db.prepare(`
            INSERT INTO lesson_progress (
                id,
                user_id,
                lesson_id,
                status,
                progress_percent,
                started_at,
                completed_at,
                updated_at
            )
            VALUES (
                ?, ?, ?, ?, ?, CURRENT_TIMESTAMP,
                CASE
                    WHEN ? = 1 THEN CURRENT_TIMESTAMP
                    ELSE NULL
                END,
                CURRENT_TIMESTAMP
            )
        `).run(
            crypto.randomUUID(),
            userId,
            lessonId,
            isCompleted ? "completed" : "in_progress",
            isCompleted ? 100 : 0,
            isCompleted ? 1 : 0
        );
    }

    synchronizeEnrollmentCompletion(
        userId,
        lesson.course_id
    );

    return db.prepare(`
        SELECT *
        FROM lesson_progress
        WHERE user_id = ?
          AND lesson_id = ?
    `).get(userId, lessonId);
}

export function getCourseProgress(userId, courseId) {
    assertCourse(courseId);

    const progress = synchronizeEnrollmentCompletion(
        userId,
        courseId
    );

    return {
        courseId,
        totalLessons: progress.totalLessons,
        completedLessons: progress.completedLessons,
        percentage: progress.percentage
    };
}
