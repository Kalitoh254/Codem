import db from "../database/db.js";

export function createUser({
    id,
    email,
    username,
    passwordHash,
    role = "user"
}) {
    const stmt = db.prepare(`
        INSERT INTO users (
            id,
            email,
            username,
            password_hash,
            role
        )
        VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
        id,
        email,
        username,
        passwordHash,
        role
    );

    return findUserById(id);
}

export function findUserById(id) {
    return db
        .prepare(`
            SELECT
                id,
                email,
                username,
                password_hash,
                role,
                status,
                email_verified,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
        `)
        .get(id);
}

export function findUserByEmail(email) {
    return db
        .prepare(`
            SELECT
                id,
                email,
                username,
                password_hash,
                role,
                status,
                email_verified,
                created_at,
                updated_at
            FROM users
            WHERE email = ?
        `)
        .get(email);
}

export function findUserByUsername(username) {
    return db
        .prepare(`
            SELECT
                id,
                email,
                username,
                password_hash,
                role,
                status,
                email_verified,
                created_at,
                updated_at
            FROM users
            WHERE username = ?
        `)
        .get(username);
}

export function listUsers(limit = 50, offset = 0) {
    return db
        .prepare(`
            SELECT
                id,
                email,
                username,
                role,
                status,
                email_verified,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `)
        .all(limit, offset);
}
