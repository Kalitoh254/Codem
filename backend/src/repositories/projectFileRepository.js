import db from "../database/db.js";

export function listProjectFiles(projectId) {
    return db.prepare(`
        SELECT
            id,
            project_id,
            path,
            content,
            created_at,
            updated_at
        FROM project_files
        WHERE project_id = ?
        ORDER BY path ASC
    `).all(projectId);
}

export function findProjectFile(id, projectId) {
    return db.prepare(`
        SELECT *
        FROM project_files
        WHERE id = ? AND project_id = ?
    `).get(id, projectId);
}

export function createProjectFile({ id, projectId, path, content }) {
    db.prepare(`
        INSERT INTO project_files
            (id, project_id, path, content)
        VALUES (?, ?, ?, ?)
    `).run(id, projectId, path, content);

    return findProjectFile(id, projectId);
}

export function updateProjectFile(id, projectId, data) {
    const fields = [];
    const values = [];

    if (data.path !== undefined) {
        fields.push("path = ?");
        values.push(data.path);
    }

    if (data.content !== undefined) {
        fields.push("content = ?");
        values.push(data.content);
    }

    if (!fields.length) {
        return findProjectFile(id, projectId);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");

    values.push(id, projectId);

    db.prepare(`
        UPDATE project_files
        SET ${fields.join(", ")}
        WHERE id = ? AND project_id = ?
    `).run(...values);

    return findProjectFile(id, projectId);
}

export function deleteProjectFile(id, projectId) {
    return db.prepare(`
        DELETE FROM project_files
        WHERE id = ? AND project_id = ?
    `).run(id, projectId);
}
