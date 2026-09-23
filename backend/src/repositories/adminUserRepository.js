import db from "../database/db.js";

export function listAdminUsers({
    search = "",
    role = null,
    status = null,
    limit = 50,
    offset = 0
} = {}) {
    const conditions = [];
    const params = [];

    if (search) {
        conditions.push(`
            (
                LOWER(u.username) LIKE LOWER(?)
                OR LOWER(u.email) LIKE LOWER(?)
            )
        `);

        const term = `%${search}%`;
        params.push(term, term);
    }

    if (role) {
        conditions.push(`u.role = ?`);
        params.push(role);
    }

    if (status) {
        conditions.push(`u.status = ?`);
        params.push(status);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    return db.prepare(`
        SELECT
            u.id,
            u.email,
            u.username,
            u.role,
            u.status,
            u.email_verified,
            u.created_at,
            u.updated_at,
            p.display_name,
            p.avatar_url,
            p.location
        FROM users u
        LEFT JOIN profiles p
            ON p.user_id = u.id
        ${where}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
}

export function countAdminUsers({
    search = "",
    role = null,
    status = null
} = {}) {
    const conditions = [];
    const params = [];

    if (search) {
        conditions.push(`
            (
                LOWER(username) LIKE LOWER(?)
                OR LOWER(email) LIKE LOWER(?)
            )
        `);

        const term = `%${search}%`;
        params.push(term, term);
    }

    if (role) {
        conditions.push(`role = ?`);
        params.push(role);
    }

    if (status) {
        conditions.push(`status = ?`);
        params.push(status);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    return db.prepare(`
        SELECT COUNT(*) AS count
        FROM users
        ${where}
    `).get(...params).count;
}

export function findAdminUserById(id) {
    return db.prepare(`
        SELECT
            u.id,
            u.email,
            u.username,
            u.role,
            u.status,
            u.email_verified,
            u.created_at,
            u.updated_at,
            p.display_name,
            p.bio,
            p.avatar_url,
            p.location,
            p.website_url,
            p.github_url,
            p.linkedin_url
        FROM users u
        LEFT JOIN profiles p
            ON p.user_id = u.id
        WHERE u.id = ?
    `).get(id);
}

export function updateUserRole(id, role) {
    db.prepare(`
        UPDATE users
        SET role = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(role, id);

    return findAdminUserById(id);
}

export function updateUserStatus(id, status) {
    db.prepare(`
        UPDATE users
        SET status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(status, id);

    return findAdminUserById(id);
}

export function revokeUserSessions(userId) {
    return db.prepare(`
        UPDATE sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
          AND revoked_at IS NULL
    `).run(userId);
}
