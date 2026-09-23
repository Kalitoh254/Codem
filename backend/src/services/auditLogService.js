import {
    createAuditLog,
    listAuditLogs,
    countAuditLogs
} from "../repositories/auditLogRepository.js";

const MAX_LIMIT = 100;

export const AUDIT_ACTIONS = Object.freeze({
    USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
    USER_STATUS_CHANGED: "USER_STATUS_CHANGED",
    USER_SESSIONS_REVOKED: "USER_SESSIONS_REVOKED"
});

function sanitizeMetadata(metadata) {
    if (!metadata || typeof metadata !== "object") {
        return null;
    }

    const forbiddenKeys = new Set([
        "password",
        "password_hash",
        "token",
        "access_token",
        "refresh_token",
        "api_key",
        "secret",
        "key",
        "authorization"
    ]);

    const sanitized = {};

    for (const [key, value] of Object.entries(metadata)) {
        if (forbiddenKeys.has(key.toLowerCase())) {
            continue;
        }

        sanitized[key] = value;
    }

    return sanitized;
}

export function recordAuditEvent({
    userId = null,
    action,
    resourceType = null,
    resourceId = null,
    ipAddress = null,
    userAgent = null,
    metadata = null
}) {
    if (!action || typeof action !== "string") {
        const error = new Error(
            "Audit action is required."
        );

        error.status = 400;
        error.code = "AUDIT_ACTION_REQUIRED";

        throw error;
    }

    return createAuditLog({
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        metadata: sanitizeMetadata(metadata)
    });
}

export function getAuditLogs({
    userId = null,
    action = null,
    resourceType = null,
    resourceId = null,
    page = 1,
    limit = 50
} = {}) {
    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) {
        page = 1;
    }

    if (!Number.isInteger(limit) || limit < 1) {
        limit = 50;
    }

    limit = Math.min(limit, MAX_LIMIT);

    const filters = {
        userId: userId || null,
        action: action || null,
        resourceType: resourceType || null,
        resourceId: resourceId || null
    };

    const offset = (page - 1) * limit;

    const logs = listAuditLogs({
        ...filters,
        limit,
        offset
    });

    const total = countAuditLogs(filters);

    return {
        logs: logs.map(log => ({
            ...log,
            metadata: log.metadata
                ? JSON.parse(log.metadata)
                : null
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}
