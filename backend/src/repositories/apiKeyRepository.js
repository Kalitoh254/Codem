import crypto from "node:crypto";

import db from "../database/db.js";

function parseScopes(value) {
    try {
        const parsed = JSON.parse(value || "[]");

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch {
        return [];
    }
}

function mapApiKey(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        key_prefix: row.key_prefix,
        scopes: parseScopes(row.scopes),
        expires_at: row.expires_at,
        last_used_at: row.last_used_at,
        revoked_at: row.revoked_at,
        created_at: row.created_at
    };
}

export function createApiKey({
    id,
    userId,
    name,
    keyPrefix,
    keyHash,
    scopes,
    expiresAt = null
}) {
    db.prepare(`
        INSERT INTO api_keys (
            id,
            user_id,
            name,
            key_prefix,
            key_hash,
            scopes,
            expires_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        userId,
        name,
        keyPrefix,
        keyHash,
        JSON.stringify(scopes),
        expiresAt
    );

    return findApiKeyById(id);
}

export function findApiKeyById(id) {
    const row = db.prepare(`
        SELECT
            id,
            user_id,
            name,
            key_prefix,
            scopes,
            expires_at,
            last_used_at,
            revoked_at,
            created_at
        FROM api_keys
        WHERE id = ?
    `).get(id);

    return mapApiKey(row);
}

export function findApiKeyByHash(keyHash) {
    const row = db.prepare(`
        SELECT
            ak.id,
            ak.user_id,
            ak.name,
            ak.key_prefix,
            ak.key_hash,
            ak.scopes,
            ak.expires_at,
            ak.last_used_at,
            ak.revoked_at,
            ak.created_at,
            u.email,
            u.username,
            u.role,
            u.status,
            u.email_verified
        FROM api_keys ak
        JOIN users u ON u.id = ak.user_id
        WHERE ak.key_hash = ?
    `).get(keyHash);

    if (!row) {
        return null;
    }

    return {
        ...mapApiKey(row),
        key_hash: row.key_hash,
        user: {
            id: row.user_id,
            email: row.email,
            username: row.username,
            role: row.role,
            status: row.status,
            email_verified: row.email_verified
        }
    };
}

export function listApiKeysByUser(userId) {
    const rows = db.prepare(`
        SELECT
            id,
            user_id,
            name,
            key_prefix,
            scopes,
            expires_at,
            last_used_at,
            revoked_at,
            created_at
        FROM api_keys
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).all(userId);

    return rows.map(mapApiKey);
}

export function findApiKeyByUserAndName(userId, name) {
    const row = db.prepare(`
        SELECT
            id,
            user_id,
            name,
            key_prefix,
            scopes,
            expires_at,
            last_used_at,
            revoked_at,
            created_at
        FROM api_keys
        WHERE user_id = ?
        AND name = ?
        LIMIT 1
    `).get(userId, name);

    return mapApiKey(row);
}

export function revokeApiKey(id) {
    db.prepare(`
        UPDATE api_keys
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND revoked_at IS NULL
    `).run(id);

    return findApiKeyById(id);
}

export function updateLastUsedAt(id) {
    db.prepare(`
        UPDATE api_keys
        SET last_used_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(id);
}

export function countActiveApiKeysByUser(userId) {
    return db.prepare(`
        SELECT COUNT(*) AS count
        FROM api_keys
        WHERE user_id = ?
        AND revoked_at IS NULL
        AND (
            expires_at IS NULL
            OR expires_at > CURRENT_TIMESTAMP
        )
    `).get(userId).count;
}
