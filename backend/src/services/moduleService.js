import crypto from "node:crypto";
import db from "../database/db.js";

import {
    listModules,
    findModuleById,
    findModuleBySlug,
    createModule,
    updateModule,
    deleteModule
} from "../repositories/moduleRepository.js";

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
            {
                status: 404,
                code: "COURSE_NOT_FOUND"
            }
        );
    }

    return course;
}

function assertModule(id) {
    const module = findModuleById(id);

    if (!module) {
        throw Object.assign(
            new Error("Module not found."),
            {
                status: 404,
                code: "MODULE_NOT_FOUND"
            }
        );
    }

    return module;
}

export function getModules(courseId) {
    assertCourse(courseId);

    return listModules(courseId);
}

export function getModule(id) {
    return assertModule(id);
}

export function createNewModule(courseId, data) {
    assertCourse(courseId);

    const title = data.title?.trim();

    if (!title || title.length < 2 || title.length > 200) {
        throw Object.assign(
            new Error(
                "Module title must be between 2 and 200 characters."
            ),
            {
                status: 400,
                code: "INVALID_MODULE_TITLE"
            }
        );
    }

    const slug = slugify(data.slug || title);

    if (!slug) {
        throw Object.assign(
            new Error("A valid module slug is required."),
            {
                status: 400,
                code: "INVALID_MODULE_SLUG"
            }
        );
    }

    if (findModuleBySlug(courseId, slug)) {
        throw Object.assign(
            new Error("Module slug already exists in this course."),
            {
                status: 409,
                code: "MODULE_SLUG_EXISTS"
            }
        );
    }

    const existingModules = listModules(courseId);

    const position = Number.isInteger(data.position)
        ? data.position
        : existingModules.length + 1;

    if (position < 0) {
        throw Object.assign(
            new Error("Module position cannot be negative."),
            {
                status: 400,
                code: "INVALID_MODULE_POSITION"
            }
        );
    }

    const status = data.status || "draft";

    if (!["draft", "published", "archived"].includes(status)) {
        throw Object.assign(
            new Error("Invalid module status."),
            {
                status: 400,
                code: "INVALID_MODULE_STATUS"
            }
        );
    }

    return createModule({
        id: crypto.randomUUID(),
        courseId,
        title,
        slug,
        description: data.description?.trim() || "",
        position,
        status
    });
}

export function editModule(id, data) {
    const module = assertModule(id);

    const update = {};

    if (data.title !== undefined) {
        const title = data.title.trim();

        if (title.length < 2 || title.length > 200) {
            throw Object.assign(
                new Error(
                    "Module title must be between 2 and 200 characters."
                ),
                {
                    status: 400,
                    code: "INVALID_MODULE_TITLE"
                }
            );
        }

        update.title = title;
    }

    if (data.slug !== undefined) {
        const slug = slugify(data.slug);

        if (!slug) {
            throw Object.assign(
                new Error("A valid module slug is required."),
                {
                    status: 400,
                    code: "INVALID_MODULE_SLUG"
                }
            );
        }

        const duplicate = findModuleBySlug(
            module.course_id,
            slug
        );

        if (duplicate && duplicate.id !== id) {
            throw Object.assign(
                new Error(
                    "Module slug already exists in this course."
                ),
                {
                    status: 409,
                    code: "MODULE_SLUG_EXISTS"
                }
            );
        }

        update.slug = slug;
    }

    if (data.description !== undefined) {
        update.description = data.description.trim();
    }

    if (data.position !== undefined) {
        const position = Number(data.position);

        if (!Number.isInteger(position) || position < 0) {
            throw Object.assign(
                new Error(
                    "Module position must be a non-negative integer."
                ),
                {
                    status: 400,
                    code: "INVALID_MODULE_POSITION"
                }
            );
        }

        update.position = position;
    }

    if (data.status !== undefined) {
        if (
            !["draft", "published", "archived"]
                .includes(data.status)
        ) {
            throw Object.assign(
                new Error("Invalid module status."),
                {
                    status: 400,
                    code: "INVALID_MODULE_STATUS"
                }
            );
        }

        update.status = data.status;
    }

    return updateModule(id, update);
}

export function removeModule(id) {
    assertModule(id);

    deleteModule(id);

    return {
        deleted: true
    };
}
