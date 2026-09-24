import crypto from "node:crypto";
import db from "../database/db.js";

import {
    listLessons,
    listLessonsByModule,
    findLessonById,
    findLessonBySlug,
    createLesson,
    updateLesson,
    deleteLesson
} from "../repositories/lessonRepository.js";

const LESSON_TYPES = [
    "reading",
    "video",
    "code",
    "interactive",
    "exercise",
    "quiz",
    "project"
];

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);
}

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

function assertModule(moduleId, courseId = null) {
    const module = db.prepare(`
        SELECT id, course_id
        FROM course_modules
        WHERE id = ?
    `).get(moduleId);

    if (!module) {
        throw Object.assign(
            new Error("Module not found."),
            { status: 404, code: "MODULE_NOT_FOUND" }
        );
    }

    if (courseId && module.course_id !== courseId) {
        throw Object.assign(
            new Error("Module does not belong to this course."),
            { status: 400, code: "MODULE_COURSE_MISMATCH" }
        );
    }

    return module;
}

function assertLesson(id) {
    const lesson = findLessonById(id);

    if (!lesson) {
        throw Object.assign(
            new Error("Lesson not found."),
            { status: 404, code: "LESSON_NOT_FOUND" }
        );
    }

    return lesson;
}

function validateLessonType(value) {
    if (!LESSON_TYPES.includes(value)) {
        throw Object.assign(
            new Error("Invalid lesson type."),
            { status: 400, code: "INVALID_LESSON_TYPE" }
        );
    }
}

function validatePosition(value) {
    const position = Number(value);

    if (!Number.isInteger(position) || position < 0) {
        throw Object.assign(
            new Error(
                "Lesson position must be a non-negative integer."
            ),
            { status: 400, code: "INVALID_LESSON_POSITION" }
        );
    }

    return position;
}

function validateEstimatedMinutes(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const minutes = Number(value);

    if (!Number.isInteger(minutes) || minutes <= 0) {
        throw Object.assign(
            new Error(
                "Estimated minutes must be a positive integer."
            ),
            { status: 400, code: "INVALID_ESTIMATED_MINUTES" }
        );
    }

    return minutes;
}

function validateRequired(value) {
    if (
        value !== true &&
        value !== false &&
        value !== 0 &&
        value !== 1
    ) {
        throw Object.assign(
            new Error("isRequired must be a boolean or 0/1."),
            { status: 400, code: "INVALID_LESSON_REQUIRED" }
        );
    }

    return value === true || value === 1 ? 1 : 0;
}

export function getLessons(courseId) {
    assertCourse(courseId);
    return listLessons(courseId);
}

export function getLessonsByModule(moduleId) {
    assertModule(moduleId);
    return listLessonsByModule(moduleId);
}

export function getLesson(id) {
    return assertLesson(id);
}

export function createNewLesson(courseId, data) {
    assertCourse(courseId);

    const title = data.title?.trim();

    if (!title || title.length < 2 || title.length > 200) {
        throw Object.assign(
            new Error(
                "Lesson title must be between 2 and 200 characters."
            ),
            { status: 400, code: "INVALID_LESSON_TITLE" }
        );
    }

    const slug = slugify(data.slug || title);

    if (!slug) {
        throw Object.assign(
            new Error("A valid lesson slug is required."),
            { status: 400, code: "INVALID_LESSON_SLUG" }
        );
    }

    if (findLessonBySlug(courseId, slug)) {
        throw Object.assign(
            new Error("Lesson slug already exists in this course."),
            { status: 409, code: "LESSON_SLUG_EXISTS" }
        );
    }

    let moduleId = null;

    if (data.moduleId !== undefined && data.moduleId !== null) {
        assertModule(data.moduleId, courseId);
        moduleId = data.moduleId;
    }

    const lessons = moduleId
        ? listLessonsByModule(moduleId)
        : listLessons(courseId);

    const position = data.position === undefined
        ? lessons.length + 1
        : validatePosition(data.position);

    const lessonType = data.lessonType || "reading";
    validateLessonType(lessonType);

    const isRequired = data.isRequired === undefined
        ? 1
        : validateRequired(data.isRequired);

    const estimatedMinutes =
        validateEstimatedMinutes(data.estimatedMinutes);

    return createLesson({
        id: crypto.randomUUID(),
        courseId,
        moduleId,
        title,
        slug,
        description: data.description?.trim() || "",
        content: data.content || "",
        position,
        lessonType,
        isRequired,
        estimatedMinutes
    });
}

export function editLesson(id, data) {
    const lesson = assertLesson(id);
    const update = {};

    if (data.title !== undefined) {
        const title = data.title.trim();

        if (title.length < 2 || title.length > 200) {
            throw Object.assign(
                new Error(
                    "Lesson title must be between 2 and 200 characters."
                ),
                { status: 400, code: "INVALID_LESSON_TITLE" }
            );
        }

        update.title = title;
    }

    if (data.slug !== undefined) {
        const slug = slugify(data.slug);

        if (!slug) {
            throw Object.assign(
                new Error("A valid lesson slug is required."),
                { status: 400, code: "INVALID_LESSON_SLUG" }
            );
        }

        const duplicate = findLessonBySlug(
            lesson.course_id,
            slug
        );

        if (duplicate && duplicate.id !== id) {
            throw Object.assign(
                new Error(
                    "Lesson slug already exists in this course."
                ),
                { status: 409, code: "LESSON_SLUG_EXISTS" }
            );
        }

        update.slug = slug;
    }

    if (data.description !== undefined) {
        update.description = data.description.trim();
    }

    if (data.content !== undefined) {
        update.content = data.content;
    }

    if (data.moduleId !== undefined) {
        if (data.moduleId === null) {
            update.module_id = null;
        } else {
            assertModule(data.moduleId, lesson.course_id);
            update.module_id = data.moduleId;
        }
    }

    if (data.position !== undefined) {
        update.position = validatePosition(data.position);
    }

    if (data.lessonType !== undefined) {
        validateLessonType(data.lessonType);
        update.lesson_type = data.lessonType;
    }

    if (data.isRequired !== undefined) {
        update.is_required = validateRequired(data.isRequired);
    }

    if (data.estimatedMinutes !== undefined) {
        update.estimated_minutes =
            validateEstimatedMinutes(data.estimatedMinutes);
    }

    return updateLesson(id, update);
}

export function removeLesson(id) {
    assertLesson(id);
    deleteLesson(id);

    return {
        deleted: true
    };
}
