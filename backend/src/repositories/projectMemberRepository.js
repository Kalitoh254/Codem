import db from "../database/db.js";

export function listProjectMembers(projectId) {
    return db.prepare(`
        SELECT
            pm.project_id,
            pm.user_id,
            pm.role,
            u.username,
            p.display_name,
            p.avatar_url
        FROM project_members pm
        JOIN users u ON u.id = pm.user_id
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE pm.project_id = ?
        ORDER BY u.username ASC
    `).all(projectId);
}

export function findProjectMember(projectId, userId) {
    return db.prepare(`
        SELECT
            project_id,
            user_id,
            role
        FROM project_members
        WHERE project_id = ? AND user_id = ?
    `).get(projectId, userId);
}

export function addProjectMember({ projectId, userId, role }) {
    db.prepare(`
        INSERT INTO project_members
            (project_id, user_id, role)
        VALUES (?, ?, ?)
    `).run(projectId, userId, role);

    return findProjectMember(projectId, userId);
}

export function updateProjectMember(projectId, userId, role) {
    db.prepare(`
        UPDATE project_members
        SET role = ?
        WHERE project_id = ? AND user_id = ?
    `).run(role, projectId, userId);

    return findProjectMember(projectId, userId);
}

export function removeProjectMember(projectId, userId) {
    return db.prepare(`
        DELETE FROM project_members
        WHERE project_id = ? AND user_id = ?
    `).run(projectId, userId);
}
