import crypto from "node:crypto";

import {
    createProject,
    findProjectById,
    findProjectBySlug,
    listProjectsByOwner,
    listPublicProjects,
    countPublicProjects,
    updateProject,
    deleteProject
} from "../repositories/projectRepository.js";

import {
    recordAuditEvent
} from "./auditLogService.js";

const ALLOWED_VISIBILITY = new Set([
    "private",
    "public",
    "unlisted"
]);

function normalizeName(name) {
    return name.trim().replace(/\s+/g, " ");
}

function createSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 150);
}

function assertVisibility(value) {
    if (!ALLOWED_VISIBILITY.has(value)) {
        throw Object.assign(
            new Error("Invalid project visibility."),
            {
                status: 400,
                code: "INVALID_PROJECT_VISIBILITY"
            }
        );
    }
}

function uniqueSlug(baseSlug, ownerId, currentId = null) {
    let slug = baseSlug;

    const existing = findProjectBySlug(slug);

    if (!existing || existing.id === currentId) {
        return slug;
    }

    const suffix = crypto.randomBytes(3).toString("hex");

    slug = `${baseSlug}-${suffix}`;

    const collision = findProjectBySlug(slug);

    if (
        collision &&
        collision.id !== currentId
    ) {
        throw Object.assign(
            new Error("Unable to generate a unique project slug."),
            {
                status: 409,
                code: "PROJECT_SLUG_CONFLICT"
            }
        );
    }

    return slug;
}

export function createNewProject(
    ownerId,
    data,
    auditContext = {}
) {
    if (
        !data.name ||
        typeof data.name !== "string"
    ) {
        throw Object.assign(
            new Error("Project name is required."),
            {
                status: 400,
                code: "PROJECT_NAME_REQUIRED"
            }
        );
    }

    const name = normalizeName(data.name);

    if (
        name.length < 2 ||
        name.length > 150
    ) {
        throw Object.assign(
            new Error(
                "Project name must be between 2 and 150 characters."
            ),
            {
                status: 400,
                code: "INVALID_PROJECT_NAME"
            }
        );
    }

    const description =
        data.description === undefined ||
        data.description === null
            ? null
            : String(data.description).trim();

    if (
        description &&
        description.length > 5000
    ) {
        throw Object.assign(
            new Error(
                "Project description cannot exceed 5000 characters."
            ),
            {
                status: 400,
                code: "INVALID_PROJECT_DESCRIPTION"
            }
        );
    }

    const visibility =
        data.visibility || "private";

    assertVisibility(visibility);

    const baseSlug = createSlug(name);

    if (!baseSlug) {
        throw Object.assign(
            new Error("Invalid project name."),
            {
                status: 400,
                code: "INVALID_PROJECT_NAME"
            }
        );
    }

    const slug = uniqueSlug(
        baseSlug,
        ownerId
    );

    const project = createProject({
        id: crypto.randomUUID(),
        ownerId,
        name,
        slug,
        description,
        visibility
    });

    recordAuditEvent({
        userId: ownerId,
        action: "PROJECT_CREATED",
        resourceType: "project",
        resourceId: project.id,
        ipAddress: auditContext.ipAddress ?? null,
        userAgent: auditContext.userAgent ?? null,
        metadata: {
            name: project.name,
            slug: project.slug,
            visibility: project.visibility
        }
    });

    return project;
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

    if (
        !Number.isInteger(page) ||
        page < 1
    ) {
        page = 1;
    }

    if (
        !Number.isInteger(limit) ||
        limit < 1
    ) {
        limit = 20;
    }

    if (limit > 50) {
        limit = 50;
    }

    const offset =
        (page - 1) * limit;

    const total =
        countPublicProjects();

    return {
        projects: listPublicProjects({
            limit,
            offset
        }),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(
                total / limit
            )
        }
    };
}

export function editProject(
    id,
    data,
    auditContext = {}
) {
    const project =
        findProjectById(id);

    if (!project) {
        throw Object.assign(
            new Error("Project not found."),
            {
                status: 404,
                code: "PROJECT_NOT_FOUND"
            }
        );
    }

    const updates = {};

    if (data.name !== undefined) {
        if (
            typeof data.name !== "string"
        ) {
            throw Object.assign(
                new Error(
                    "Project name must be a string."
                ),
                {
                    status: 400,
                    code: "INVALID_PROJECT_NAME"
                }
            );
        }

        const name =
            normalizeName(data.name);

        if (
            name.length < 2 ||
            name.length > 150
        ) {
            throw Object.assign(
                new Error(
                    "Project name must be between 2 and 150 characters."
                ),
                {
                    status: 400,
                    code: "INVALID_PROJECT_NAME"
                }
            );
        }

        updates.name = name;

        const newSlug =
            createSlug(name);

        if (
            !newSlug ||
            newSlug !== project.slug
        ) {
            updates.slug =
                uniqueSlug(
                    newSlug,
                    project.owner_id,
                    id
                );
        }
    }

    if (data.description !== undefined) {
        if (
            data.description !== null &&
            typeof data.description !== "string"
        ) {
            throw Object.assign(
                new Error(
                    "Project description must be a string."
                ),
                {
                    status: 400,
                    code: "INVALID_PROJECT_DESCRIPTION"
                }
            );
        }

        updates.description =
            data.description === null
                ? null
                : data.description.trim();

        if (
            updates.description &&
            updates.description.length > 5000
        ) {
            throw Object.assign(
                new Error(
                    "Project description cannot exceed 5000 characters."
                ),
                {
                    status: 400,
                    code: "INVALID_PROJECT_DESCRIPTION"
                }
            );
        }
    }

    if (data.visibility !== undefined) {
        assertVisibility(
            data.visibility
        );

        updates.visibility =
            data.visibility;
    }

    const updated =
        updateProject(id, updates);

    recordAuditEvent({
        userId: auditContext.userId ?? null,
        action: "PROJECT_UPDATED",
        resourceType: "project",
        resourceId: id,
        ipAddress: auditContext.ipAddress ?? null,
        userAgent: auditContext.userAgent ?? null,
        metadata: {
            changedFields: Object.keys(updates)
        }
    });

    return updated;
}

export function removeProject(
    id,
    auditContext = {}
) {
    const project =
        findProjectById(id);

    if (!project) {
        throw Object.assign(
            new Error("Project not found."),
            {
                status: 404,
                code: "PROJECT_NOT_FOUND"
            }
        );
    }

    deleteProject(id);

    recordAuditEvent({
        userId: auditContext.userId ?? null,
        action: "PROJECT_DELETED",
        resourceType: "project",
        resourceId: id,
        ipAddress: auditContext.ipAddress ?? null,
        userAgent: auditContext.userAgent ?? null,
        metadata: {
            name: project.name,
            slug: project.slug
        }
    });

    return {
        message: "Project deleted successfully."
    };
}
