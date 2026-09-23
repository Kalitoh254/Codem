import crypto from "node:crypto";
import {
    createCourse,
    findCourseById,
    findCourseBySlug,
    listCourses,
    countCourses,
    updateCourse,
    deleteCourse
} from "../repositories/courseRepository.js";

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
            { status: 404, code: "COURSE_NOT_FOUND" }
        );
    }

    return course;
}

export function createNewCourse(data) {
    const title = data.title?.trim();

    if (!title || title.length < 2 || title.length > 200) {
        throw Object.assign(
            new Error("Course title must be between 2 and 200 characters."),
            { status: 400, code: "INVALID_COURSE_TITLE" }
        );
    }

    const slug = slugify(data.slug || title);

    if (!slug) {
        throw Object.assign(
            new Error("A valid course slug is required."),
            { status: 400, code: "INVALID_COURSE_SLUG" }
        );
    }

    if (findCourseBySlug(slug)) {
        throw Object.assign(
            new Error("Course slug already exists."),
            { status: 409, code: "COURSE_SLUG_EXISTS" }
        );
    }

    return createCourse({
        id: crypto.randomUUID(),
        title,
        slug,
        description: data.description?.trim() || "",
        difficulty: data.difficulty || "beginner",
        status: data.status || "draft"
    });
}

export function getCourse(id) {
    return assertCourse(id);
}

export function getCourses(options = {}) {
    const page = Math.max(Number.parseInt(options.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(Number.parseInt(options.limit, 10) || 20, 1),
        50
    );

    const filters = {
        difficulty: options.difficulty,
        status: options.status
    };

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

export function editCourse(id, data) {
    const course = assertCourse(id);
    const update = {};

    if (data.title !== undefined) {
        const title = data.title.trim();

        if (title.length < 2 || title.length > 200) {
            throw Object.assign(
                new Error("Invalid course title."),
                { status: 400, code: "INVALID_COURSE_TITLE" }
            );
        }

        update.title = title;
    }

    if (data.slug !== undefined) {
        const slug = slugify(data.slug);

        const duplicate = findCourseBySlug(slug);

        if (duplicate && duplicate.id !== id) {
            throw Object.assign(
                new Error("Course slug already exists."),
                { status: 409, code: "COURSE_SLUG_EXISTS" }
            );
        }

        update.slug = slug;
    }

    for (const field of ["description", "difficulty", "status"]) {
        if (data[field] !== undefined) update[field] = data[field];
    }

    return updateCourse(course.id, update);
}

export function removeCourse(id) {
    assertCourse(id);
    deleteCourse(id);
    return { deleted: true };
}
