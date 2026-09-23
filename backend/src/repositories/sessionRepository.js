import crypto from "node:crypto";

import db from "../database/db.js";

function hashToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

export function createSession({
    id,
    userId,
    token,
    expiresAt
}) {
    const tokenHash = hashToken(token);

    db.prepare(`
        INSERT INTO sessions (
            id,
            user_id,
            token_hash,
            expires_at
        )
        VALUES (?, ?, ?, ?)
    `).run(
        id,
        userId,
        tokenHash,
        expiresAt
    );

    return findSessionByToken(token);
}

export function findSessionByToken(token) {
    const tokenHash = hashToken(token);

    return db
        .prepare(`
            SELECT
                s.id,
                s.user_id,
                s.expires_at,
                s.created_at,
                s.revoked_at,
                u.email,
                u.username,
                u.role,
                u.status,
                u.email_verified
            FROM sessions s
            INNER JOIN users u
                ON u.id = s.user_id
            WHERE s.token_hash = ?
        `)
        .get(tokenHash);
}

export function revokeSessionByToken(token) {
    const tokenHash = hashToken(token);

    return db
        .prepare(`
            UPDATE sessions
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE token_hash = ?
              AND revoked_at IS NULL
        `)
        .run(tokenHash);
}

export function revokeAllUserSessions(userId) {
    return db
        .prepare(`
            UPDATE sessions
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
              AND revoked_at IS NULL
        `)
        .run(userId);
}

export function deleteExpiredSessions() {
    return db
        .prepare(`
            DELETE FROM sessions
            WHERE expires_at <= CURRENT_TIMESTAMP
               OR revoked_at IS NOT NULL
        `)
        .run();
}
