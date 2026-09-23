import db from "../database/db.js";

export function requireProjectOwnerOrAdmin(req, res, next) {
    try {
        const projectId = req.params.projectId || req.params.id;

        if (!projectId) {
            const error = new Error("Project identifier is required.");
            error.status = 400;
            error.code = "PROJECT_ID_REQUIRED";
            throw error;
        }

        const project = db.prepare(`
            SELECT id, owner_id, visibility
            FROM projects
            WHERE id = ?
        `).get(projectId);

        if (!project) {
            const error = new Error("Project not found.");
            error.status = 404;
            error.code = "PROJECT_NOT_FOUND";
            throw error;
        }

        if (
            project.owner_id !== req.user.id &&
            req.user.role !== "admin"
        ) {
            const error = new Error(
                "You do not have permission to modify this project."
            );
            error.status = 403;
            error.code = "PROJECT_ACCESS_DENIED";
            throw error;
        }

        req.project = project;
        next();
    } catch (error) {
        next(error);
    }
}

export function requireProjectAccess(req, res, next) {
    try {
        const projectId = req.params.projectId || req.params.id;

        const project = db.prepare(`
            SELECT
                p.id,
                p.owner_id,
                p.visibility,
                EXISTS(
                    SELECT 1
                    FROM project_members pm
                    WHERE pm.project_id = p.id
                    AND pm.user_id = ?
                ) AS is_member
            FROM projects p
            WHERE p.id = ?
        `).get(req.user?.id ?? null, projectId);

        if (!project) {
            const error = new Error("Project not found.");
            error.status = 404;
            error.code = "PROJECT_NOT_FOUND";
            throw error;
        }

        if (
            project.visibility === "private" &&
            project.owner_id !== req.user?.id &&
            !project.is_member &&
            req.user?.role !== "admin"
        ) {
            const error = new Error("Project access denied.");
            error.status = 403;
            error.code = "PROJECT_ACCESS_DENIED";
            throw error;
        }

        req.project = project;
        next();
    } catch (error) {
        next(error);
    }
}
