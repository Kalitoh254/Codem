import db from "../database/db.js";

function getProjectId(req) {
    return req.params.projectId || req.params.id;
}

function projectNotFound() {
    return Object.assign(
        new Error("Project not found."),
        {
            status: 404,
            code: "PROJECT_NOT_FOUND"
        }
    );
}

function projectAccessDenied(message = "Project access denied.") {
    return Object.assign(
        new Error(message),
        {
            status: 403,
            code: "PROJECT_ACCESS_DENIED"
        }
    );
}

export function requireProjectOwnerOrAdmin(req, _res, next) {
    try {
        const projectId = getProjectId(req);

        if (!projectId) {
            throw Object.assign(
                new Error("Project identifier is required."),
                {
                    status: 400,
                    code: "PROJECT_ID_REQUIRED"
                }
            );
        }

        const project = db.prepare(`
            SELECT
                id,
                owner_id,
                visibility
            FROM projects
            WHERE id = ?
        `).get(projectId);

        if (!project) {
            throw projectNotFound();
        }

        if (
            project.owner_id !== req.user.id &&
            req.user.role !== "admin"
        ) {
            throw projectAccessDenied(
                "You do not have permission to modify this project."
            );
        }

        req.project = project;
        req.projectRole = "owner";

        next();
    } catch (error) {
        next(error);
    }
}

export function requireProjectAccess(req, _res, next) {
    try {
        const projectId = getProjectId(req);

        if (!projectId) {
            throw Object.assign(
                new Error("Project identifier is required."),
                {
                    status: 400,
                    code: "PROJECT_ID_REQUIRED"
                }
            );
        }

        const project = db.prepare(`
            SELECT
                p.id,
                p.owner_id,
                p.visibility,
                pm.role AS member_role
            FROM projects p
            LEFT JOIN project_members pm
                ON pm.project_id = p.id
                AND pm.user_id = ?
            WHERE p.id = ?
        `).get(
            req.user?.id ?? null,
            projectId
        );

        if (!project) {
            throw projectNotFound();
        }

        const isOwner =
            project.owner_id === req.user?.id;

        const isAdmin =
            req.user?.role === "admin";

        const isMember =
            Boolean(project.member_role);

        if (
            project.visibility === "private" &&
            !isOwner &&
            !isMember &&
            !isAdmin
        ) {
            throw projectAccessDenied();
        }

        req.project = project;

        req.projectRole =
            isAdmin
                ? "admin"
                : isOwner
                    ? "owner"
                    : project.member_role || null;

        next();
    } catch (error) {
        next(error);
    }
}

export function requireProjectWriteAccess(req, _res, next) {
    try {
        const projectId = getProjectId(req);

        if (!projectId) {
            throw Object.assign(
                new Error("Project identifier is required."),
                {
                    status: 400,
                    code: "PROJECT_ID_REQUIRED"
                }
            );
        }

        const project = db.prepare(`
            SELECT
                p.id,
                p.owner_id,
                p.visibility,
                pm.role AS member_role
            FROM projects p
            LEFT JOIN project_members pm
                ON pm.project_id = p.id
                AND pm.user_id = ?
            WHERE p.id = ?
        `).get(
            req.user?.id ?? null,
            projectId
        );

        if (!project) {
            throw projectNotFound();
        }

        const isOwner =
            project.owner_id === req.user?.id;

        const isAdmin =
            req.user?.role === "admin";

        const role =
            isAdmin
                ? "admin"
                : isOwner
                    ? "owner"
                    : project.member_role || null;

        if (
            !isOwner &&
            !isAdmin &&
            role !== "admin" &&
            role !== "editor"
        ) {
            throw projectAccessDenied(
                "You do not have permission to modify project files."
            );
        }

        req.project = project;
        req.projectRole = role;

        next();
    } catch (error) {
        next(error);
    }
}
