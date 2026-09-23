import crypto from "node:crypto";

import db from "../database/db.js";

export function createAuditLog({
    userId = null,
    action,
    resourceType = null,
    resourceId = null,
    ipAddress = null,
    userAgent = null,
    metadata = null
}) {
    const id = crypto.randomUUID();

    const serializedMetadata =
        metadata === null
            ? null
            : JSON.stringify(metadata);

    db.prepare(`
        INSERT INTO audit_logs (
            id,
            user_id,
            action,
            resource_type,
            resource_id,
            ip_address,
            user_agent,
            metadata
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        serializedMetadata
    );

    return findAuditLogById(id);
}

export function findAuditLogById(id) {
    return db.prepare(`
        SELECT
            id,
            user_id,
            action,
            resource_type,
            resource_id,
            ip_address,
            user_agent,
            metadata,
            created_at
        FROM audit_logs
        WHERE id = ?
    `).get(id);
}

export function listAuditLogs({
    userId = null,
    action = null,
    resourceType = null,
    resourceId = null,
    limit = 50,
    offset = 0
} = {}) {
    const conditions = [];
    const params = [];

    if (userId) {
        conditions.push("user_id = ?");
        params.push(userId);
    }

    if (action) {
        conditions.push("action = ?");
        params.push(action);
    }

    if (resourceType) {
        conditions.push("resource_type = ?");
        params.push(resourceType);
    }

    if (resourceId) {
        conditions.push("resource_id = ?");
        params.push(resourceId);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    return db.prepare(`
        SELECT
            id,
            user_id,
            action,
            resource_type,
            resource_id,
            ip_address,
            user_agent,
            metadata,
            created_at
        FROM audit_logs
        ${where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
}

export function countAuditLogs({
    userId = null,
    action = null,
    resourceType = null,
    resourceId = null
} = {}) {
    const conditions = [];
    const params = [];

    if (userId) {
        conditions.push("user_id = ?");
        params.push(userId);
    }

    if (action) {
        conditions.push("action = ?");
        params.push(action);
    }

    if (resourceType) {
        conditions.push("resource_type = ?");
        params.push(resourceType);
    }

    if (resourceId) {
        conditions.push("resource_id = ?");
        params.push(resourceId);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    return db.prepare(`
        SELECT COUNT(*) AS count
        FROM audit_logs
        ${where}
    `).get(...params).count;
}
