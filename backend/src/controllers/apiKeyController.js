import {
    createUserApiKey,
    getUserApiKeys,
    revokeUserApiKey
} from "../services/apiKeyService.js";

import {
    recordAuditEvent,
    AUDIT_ACTIONS
} from "../services/auditLogService.js";

function requestMetadata(req) {
    return {
        ipAddress: req.ip,
        userAgent:
            req.get("user-agent") || null
    };
}

export function createApiKeyController(req, res, next) {
    try {
        const result = createUserApiKey({
            userId: req.user.id,
            name: req.body.name,
            scopes: req.body.scopes,
            expiresAt:
                req.body.expiresAt ?? null
        });

        recordAuditEvent({
            userId: req.user.id,
            action: "API_KEY_CREATED",
            resourceType: "api_key",
            resourceId: result.apiKey.id,
            ...requestMetadata(req),
            metadata: {
                name: result.apiKey.name,
                scopes: result.apiKey.scopes,
                expiresAt: result.apiKey.expires_at
            }
        });

        res.status(201).json({
            success: true,
            data: {
                apiKey: result.apiKey,
                key: result.key
            }
        });
    } catch (error) {
        next(error);
    }
}

export function listApiKeysController(req, res, next) {
    try {
        const userId =
            req.user.role === "admin" &&
            req.query.userId
                ? req.query.userId
                : req.user.id;

        const apiKeys =
            getUserApiKeys(userId);

        res.status(200).json({
            success: true,
            data: {
                apiKeys
            }
        });
    } catch (error) {
        next(error);
    }
}

export function revokeApiKeyController(req, res, next) {
    try {
        const apiKey =
            revokeUserApiKey({
                apiKeyId: req.params.id,
                actorUserId: req.user.id,
                actorRole: req.user.role
            });

        recordAuditEvent({
            userId: req.user.id,
            action: "API_KEY_REVOKED",
            resourceType: "api_key",
            resourceId: apiKey.id,
            ...requestMetadata(req),
            metadata: {
                name: apiKey.name,
                keyPrefix: apiKey.key_prefix
            }
        });

        res.status(200).json({
            success: true,
            data: {
                apiKey
            }
        });
    } catch (error) {
        next(error);
    }
}
