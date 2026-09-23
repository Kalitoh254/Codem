import db from "../database/db.js";

export function createProject({
    id,
    ownerId,
    name,
    slug,
    description = null,
    visibility = "public"
}) {
    db.prepare(`
        INSERT INTO projects (
            id,
            owner_id,
            name,
            slug,
            description,
            visibility
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        id,
        ownerId,
        name,
        slug,
        description,
        visibility
    );

    return findProjectById(id);
}

export function findProjectById(id) {
    return db.prepare(`
        SELECT
            p.*,
            u.username AS owner_username
        FROM projects p
        INNER JOIN users u
            ON u.id = p.owner_id
        WHERE p.id = ?
    `).get(id);
}

export function findProjectBySlug(slug) {
    return db.prepare(`
        SELECT
            p.*,
            u.username AS owner_username
        FROM projects p
        INNER JOIN users u
            ON u.id = p.owner_id
        WHERE p.slug = ?
    `).get(slug);
}

export function listProjectsByOwner(ownerId) {
    return db.prepare(`
        SELECT
            p.*,
            u.username AS owner_username
        FROM projects p
        INNER JOIN users u
            ON u.id = p.owner_id
        WHERE p.owner_id = ?
        ORDER BY p.created_at DESC
    `).all(ownerId);
}

export function listPublicProjects({
    limit = 20,
    offset = 0
}) {
    return db.prepare(`
        SELECT
            p.*,
            u.username AS owner_username
        FROM projects p
        INNER JOIN users u
            ON u.id = p.owner_id
        WHERE p.visibility = 'public'
        ORDER BY p.created_at DESC
        LIMIT ?
        OFFSET ?
    `).all(limit, offset);
}

export function updateProject(
    id,
    data
) {
    const fields = [];
    const values = [];

    const allowedFields = [
        "name",
        "slug",
        "description",
        "visibility"
    ];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    }

    if (fields.length === 0) {
        return findProjectById(id);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    db.prepare(`
        UPDATE projects
        SET ${fields.join(", ")}
        WHERE id = ?
    `).run(...values);

    return findProjectById(id);
}

export function deleteProject(id) {
    db.prepare(`
        DELETE FROM projects
        WHERE id = ?
    `).run(id);
}
