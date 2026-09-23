import crypto from "node:crypto";

import {
    createProject,
    findProjectById,
    findProjectBySlug,
    listProjectsByOwner,
    listPublicProjects,
    updateProject,
    deleteProject
} from "../repositories/projectRepository.js";

function normalizeName(name) {
    return name.trim().replace(/\s+/g, " ");
}

function createSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const ALLOWED_VISIBILITY = [
    "public",
    "private"
];

export function createNewProject(
    ownerId,
    data
) {
    if (!data.name || typeof data.name !== "string") {
        const error = new Error("Project name is required.");
        error.status = 400;
        error.code = "PROJECT_NAME_REQUIRED";
        throw error;
    }

    const name = normalizeName(data.name);

    if (name.length < 2 || name.length > 150) {
        const error = new Error(
            "Project name must be between 2 and 150 characters."
        );
        error.status = 400;
        error.code = "INVALID_PROJECT_NAME";
        throw error;
    }

    const description =
        data.description === undefined ||
        data.description === null
            ? null
            : String(data.description).trim();

    if (description && description.length > 5000) {
        const error = new Error(
            "Project description cannot exceed 5000 characters."
        );
        error.status = 400;
        error.code = "INVALID_PROJECT_DESCRIPTION";
        throw error;
    }

    const visibility =
        data.visibility || "public";

    if (!ALLOWED_VISIBILITY.includes(visibility)) {
        const error = new Error(
            "Invalid project visibility."
        );
        error.status = 400;
        error.code = "INVALID_PROJECT_VISIBILITY";
        throw error;
    }

    let slug = createSlug(name);

    if (!slug) {
        const error = new Error("Invalid project name.");
        error.status = 400;
        error.code = "INVALID_PROJECT_NAME";
        throw error;
    }

    const existing = findProjectBySlug(slug);

    if (existing) {
        slug = `${slug}-${crypto.randomBytes(3).toString("hex")}`;
    }

    return createProject({
        id: crypto.randomUUID(),
        ownerId,
        name,
        slug,
        description,
        visibility
    });
}

export function getProject(id) {
    return findProjectById(id);
}

export function getDeveloperProjects(ownerId) {
    return listProjectsByOwner(ownerId);
}

export function getPublicProjects(
    page = 1,
    limit = 20
) {
    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) {
        page = 1;
    }

    if (!Number.isInteger(limit) || limit < 1) {
        limit = 20;
    }

    if (limit > 50) {
        limit = 50;
    }

    const offset = (page - 1) * limit;

    return {
        projects: listPublicProjects({
            limit,
            offset
        }),
        pagination: {
            page,
            limit
        }
    };
}

export function editProject(
    id,
    data
) {
    const project = findProjectById(id);

    if (!project) {
        const error = new Error("Project not found.");
        error.status = 404;
        error.code = "PROJECT_NOT_FOUND";
        throw error;
    }

    const updates = {};

    if (data.name !== undefined) {
        if (typeof data.name !== "string") {
            const error = new Error(
                "Project name must be a string."
            );
            error.status = 400;
            error.code = "INVALID_PROJECT_NAME";
            throw error;
        }

        const name = normalizeName(data.name);

        if (name.length < 2 || name.length > 150) {
            const error = new Error(
                "Project name must be between 2 and 150 characters."
            );
            error.status = 400;
            error.code = "INVALID_PROJECT_NAME";
            throw error;
        }

        updates.name = name;
    }

    if (data.description !== undefined) {
        if (
            data.description !== null &&
            typeof data.description !== "string"
        ) {
            const error = new Error(
                "Project description must be a string."
            );
            error.status = 400;
            error.code = "INVALID_PROJECT_DESCRIPTION";
            throw error;
        }

        updates.description =
            data.description === null
                ? null
                : data.description.trim();

        if (
            updates.description &&
            updates.description.length > 5000
        ) {
            const error = new Error(
                "Project description cannot exceed 5000 characters."
            );
            error.status = 400;
            error.code = "INVALID_PROJECT_DESCRIPTION";
            throw error;
        }
    }

    if (data.visibility !== undefined) {
        if (!ALLOWED_VISIBILITY.includes(data.visibility)) {
            const error = new Error(
                "Invalid project visibility."
            );
            error.status = 400;
            error.code = "INVALID_PROJECT_VISIBILITY";
            throw error;
        }

        updates.visibility = data.visibility;
    }

    if (updates.name !== undefined) {
        const newSlug = createSlug(updates.name);

        if (newSlug && newSlug !== project.slug) {
            const existing = findProjectBySlug(newSlug);

            if (!existing || existing.id === id) {
                updates.slug = newSlug;
            }
        }
    }

    return updateProject(id, updates);
}

export function removeProject(id) {
    const project = findProjectById(id);

    if (!project) {
        const error = new Error("Project not found.");
        error.status = 404;
        error.code = "PROJECT_NOT_FOUND";
        throw error;
    }

    deleteProject(id);

    return {
        message: "Project deleted successfully."
    };
}
