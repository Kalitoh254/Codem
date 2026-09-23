import crypto from "node:crypto";

import db from "../database/db.js";

function hashToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

export function createEmailVerificationToken({
    id,
    userId,
    token,
    expiresAt
}) {
    const tokenHash = hashToken(token);

    db.prepare(`
        INSERT INTO email_verification_tokens (
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

    return findEmailVerificationToken(token);
}

export function findEmailVerificationToken(token) {
    const tokenHash = hashToken(token);

    return db
        .prepare(`
            SELECT
                id,
                user_id,
                token_hash,
                expires_at,
                used_at,
                created_at
            FROM email_verification_tokens
            WHERE token_hash = ?
        `)
        .get(tokenHash);
}

export function markEmailVerificationTokenUsed(token) {
    const tokenHash = hashToken(token);

    return db
        .prepare(`
            UPDATE email_verification_tokens
            SET used_at = CURRENT_TIMESTAMP
            WHERE token_hash = ?
              AND used_at IS NULL
        `)
        .run(tokenHash);
}

export function revokeUserEmailVerificationTokens(userId) {
    return db
        .prepare(`
            UPDATE email_verification_tokens
            SET used_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
              AND used_at IS NULL
        `)
        .run(userId);
}

export function deleteExpiredEmailVerificationTokens() {
    return db
        .prepare(`
            DELETE FROM email_verification_tokens
            WHERE expires_at <= CURRENT_TIMESTAMP
               OR used_at IS NOT NULL
        `)
        .run();
}
