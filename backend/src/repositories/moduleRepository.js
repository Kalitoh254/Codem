import db from "../database/db.js";

export function listModules(courseId) {
    return db.prepare(`
        SELECT *
        FROM course_modules
        WHERE course_id = ?
        ORDER BY position ASC, created_at ASC
    `).all(courseId);
}

export function findModuleById(id) {
    return db.prepare(`
        SELECT *
        FROM course_modules
        WHERE id = ?
    `).get(id);
}

export function findModuleBySlug(courseId, slug) {
    return db.prepare(`
        SELECT *
        FROM course_modules
        WHERE course_id = ?
          AND slug = ?
    `).get(courseId, slug);
}

export function createModule(data) {
    db.prepare(`
        INSERT INTO course_modules (
            id,
            course_id,
            title,
            slug,
            description,
            position,
            status,
            created_at,
            updated_at
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
    `).run(
        data.id,
        data.courseId,
        data.title,
        data.slug,
        data.description,
        data.position,
        data.status
    );

    return findModuleById(data.id);
}

export function updateModule(id, data) {
    const fields = [];
    const params = [];

    for (const field of [
        "title",
        "slug",
        "description",
        "position",
        "status"
    ]) {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            params.push(data[field]);
        }
    }

    if (!fields.length) {
        return findModuleById(id);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    db.prepare(`
        UPDATE course_modules
        SET ${fields.join(", ")}
        WHERE id = ?
    `).run(...params);

    return findModuleById(id);
}

export function deleteModule(id) {
    return db.prepare(`
        DELETE FROM course_modules
        WHERE id = ?
    `).run(id);
}
