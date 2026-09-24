import crypto from "node:crypto";

import {
    createCourse,
    findCourseById,
    findCourseBySlug,
    listCourses,
    countCourses,
    updateCourse,
    deleteCourse,
    findCourseCurriculum
} from "../repositories/courseRepository.js";

const DIFFICULTIES = [
    "beginner",
    "intermediate",
    "advanced"
];

const COURSE_STATUSES = [
    "draft",
    "published",
    "archived"
];

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);
}

function assertCourse(id) {
    const course = findCourseById(id);

    if (!course) {
        throw Object.assign(
            new Error("Course not found."),
            {
                status: 404,
                code: "COURSE_NOT_FOUND"
            }
        );
    }

    return course;
}

function validateDifficulty(value) {
    if (!DIFFICULTIES.includes(value)) {
        throw Object.assign(
            new Error("Invalid course difficulty."),
            {
                status: 400,
                code: "INVALID_COURSE_DIFFICULTY"
            }
        );
    }
}

function validateStatus(value) {
    if (!COURSE_STATUSES.includes(value)) {
        throw Object.assign(
            new Error("Invalid course status."),
            {
                status: 400,
                code: "INVALID_COURSE_STATUS"
            }
        );
    }
}

function validateDuration(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const duration = Number(value);

    if (!Number.isInteger(duration) || duration <= 0) {
        throw Object.assign(
            new Error(
                "Course duration must be a positive integer."
            ),
            {
                status: 400,
                code: "INVALID_COURSE_DURATION"
            }
        );
    }

    return duration;
}

function validateTextArray(value, fieldName) {
    if (value === null || value === undefined) {
        return null;
    }

    if (!Array.isArray(value)) {
        throw Object.assign(
            new Error(`${fieldName} must be an array.`),
            {
                status: 400,
                code: `INVALID_${fieldName
                    .toUpperCase()
                    .replace(/[^A-Z0-9]+/g, "_")}`
            }
        );
    }

    const cleaned = value
        .map(item => String(item).trim())
        .filter(Boolean);

    return JSON.stringify(cleaned);
}

export function createNewCourse(data = {}, createdBy = null) {
    const title = data.title?.trim();

    if (
        !title ||
        title.length < 2 ||
        title.length > 200
    ) {
        throw Object.assign(
            new Error(
                "Course title must be between 2 and 200 characters."
            ),
            {
                status: 400,
                code: "INVALID_COURSE_TITLE"
            }
        );
    }

    const slug = slugify(data.slug || title);

    if (!slug) {
        throw Object.assign(
            new Error("A valid course slug is required."),
            {
                status: 400,
                code: "INVALID_COURSE_SLUG"
            }
        );
    }

    if (findCourseBySlug(slug)) {
        throw Object.assign(
            new Error("Course slug already exists."),
            {
                status: 409,
                code: "COURSE_SLUG_EXISTS"
            }
        );
    }

    const difficulty = data.difficulty || "beginner";
    validateDifficulty(difficulty);

    const status = data.status || "draft";
    validateStatus(status);

    const durationMinutes =
        validateDuration(data.durationMinutes);

    const prerequisites =
        validateTextArray(
            data.prerequisites,
            "prerequisites"
        );

    const learningOutcomes =
        validateTextArray(
            data.learningOutcomes,
            "learningOutcomes"
        );

    return createCourse({
        id: crypto.randomUUID(),
        title,
        slug,
        description: data.description?.trim() || "",
        thumbnailUrl: data.thumbnailUrl?.trim() || null,
        difficulty,
        status,
        category: data.category?.trim() || null,
        durationMinutes,
        prerequisites,
        learningOutcomes,
        createdBy
    });
}

export function getCourse(id) {
    return assertCourse(id);
}

export function getCourseCurriculum(id) {
    const rows = findCourseCurriculum(id);

    if (!rows.length) {
        assertCourse(id);
    }

    const first = rows[0];

    const prerequisites = first.course_prerequisites
        ? JSON.parse(first.course_prerequisites)
        : [];

    const learningOutcomes = first.course_learning_outcomes
        ? JSON.parse(first.course_learning_outcomes)
        : [];

    const modules = [];
    const moduleMap = new Map();

    let lessonCount = 0;
    let requiredLessonCount = 0;
    let estimatedMinutes = 0;

    for (const row of rows) {
        if (!row.module_id) {
            continue;
        }

        let module = moduleMap.get(row.module_id);

        if (!module) {
            module = {
                id: row.module_id,
                title: row.module_title,
                slug: row.module_slug,
                description: row.module_description,
                position: row.module_position,
                status: row.module_status,
                lessons: []
            };

            moduleMap.set(row.module_id, module);
            modules.push(module);
        }

        if (row.lesson_id) {
            lessonCount++;

            if (row.is_required) {
                requiredLessonCount++;
            }

            if (row.estimated_minutes) {
                estimatedMinutes += row.estimated_minutes;
            }

            module.lessons.push({
                id: row.lesson_id,
                title: row.lesson_title,
                slug: row.lesson_slug,
                description: row.lesson_description,
                position: row.lesson_position,
                lessonType: row.lesson_type,
                isRequired: Boolean(row.is_required),
                estimatedMinutes: row.estimated_minutes
            });
        }
    }

    return {
        id: first.course_id,
        title: first.course_title,
        slug: first.course_slug,
        description: first.course_description,
        thumbnailUrl: first.course_thumbnail_url,
        difficulty: first.course_difficulty,
        status: first.course_status,
        category: first.course_category,
        durationMinutes: first.course_duration_minutes,
        prerequisites,
        learningOutcomes,

        statistics: {
            moduleCount: modules.length,
            lessonCount,
            requiredLessonCount,
            estimatedMinutes
        },

        modules
    };
}

export function getCourses(options = {}) {
    const page = Math.max(
        Number.parseInt(options.page, 10) || 1,
        1
    );

    const limit = Math.min(
        Math.max(
            Number.parseInt(options.limit, 10) || 20,
            1
        ),
        50
    );

    const filters = {
        difficulty: options.difficulty,
        status: options.status,
        category: options.category
    };

    if (filters.difficulty) {
        validateDifficulty(filters.difficulty);
    }

    if (filters.status) {
        validateStatus(filters.status);
    }

    const total = countCourses(filters);

    return {
        courses: listCourses({
            ...filters,
            limit,
            offset: (page - 1) * limit
        }),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export function editCourse(id, data = {}) {
    const course = assertCourse(id);
    const update = {};

    if (data.title !== undefined) {
        const title = data.title.trim();

        if (
            title.length < 2 ||
            title.length > 200
        ) {
            throw Object.assign(
                new Error("Invalid course title."),
                {
                    status: 400,
                    code: "INVALID_COURSE_TITLE"
                }
            );
        }

        update.title = title;
    }

    if (data.slug !== undefined) {
        const slug = slugify(data.slug);

        if (!slug) {
            throw Object.assign(
                new Error(
                    "A valid course slug is required."
                ),
                {
                    status: 400,
                    code: "INVALID_COURSE_SLUG"
                }
            );
        }

        const duplicate = findCourseBySlug(slug);

        if (duplicate && duplicate.id !== id) {
            throw Object.assign(
                new Error("Course slug already exists."),
                {
                    status: 409,
                    code: "COURSE_SLUG_EXISTS"
                }
            );
        }

        update.slug = slug;
    }

    if (data.description !== undefined) {
        update.description = data.description.trim();
    }

    if (data.thumbnailUrl !== undefined) {
        update.thumbnailUrl =
            data.thumbnailUrl?.trim() || null;
    }

    if (data.category !== undefined) {
        update.category =
            data.category?.trim() || null;
    }

    if (data.difficulty !== undefined) {
        validateDifficulty(data.difficulty);
        update.difficulty = data.difficulty;
    }

    if (data.status !== undefined) {
        validateStatus(data.status);
        update.status = data.status;
    }

    if (data.durationMinutes !== undefined) {
        update.durationMinutes =
            validateDuration(data.durationMinutes);
    }

    if (data.prerequisites !== undefined) {
        update.prerequisites =
            validateTextArray(
                data.prerequisites,
                "prerequisites"
            );
    }

    if (data.learningOutcomes !== undefined) {
        update.learningOutcomes =
            validateTextArray(
                data.learningOutcomes,
                "learningOutcomes"
            );
    }

    return updateCourse(course.id, update);
}

export function removeCourse(id) {
    assertCourse(id);

    deleteCourse(id);

    return {
        deleted: true
    };
}
