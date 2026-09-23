import crypto from "node:crypto";

import {
    createApiKey,
    findApiKeyById,
    findApiKeyByHash,
    findApiKeyByUserAndName,
    listApiKeysByUser,
    revokeApiKey,
    updateLastUsedAt
} from "../repositories/apiKeyRepository.js";

import {
    findUserById
} from "../repositories/userRepository.js";

const MAX_NAME_LENGTH = 100;

export const API_KEY_SCOPES = Object.freeze([
    "read",
    "write",
    "admin"
]);

function generateSecret() {
    return crypto.randomBytes(32).toString("hex");
}

function hashSecret(secret) {
    return crypto
        .createHash("sha256")
        .update(secret)
        .digest("hex");
}

function normalizeName(name) {
    return String(name || "").trim();
}

function validateScopes(scopes) {
    if (!Array.isArray(scopes) || scopes.length === 0) {
        const error = new Error(
            "At least one API key scope is required."
        );

        error.status = 400;
        error.code = "API_KEY_SCOPES_REQUIRED";

        throw error;
    }

    const uniqueScopes = [...new Set(scopes)];

    const invalidScopes = uniqueScopes.filter(
        scope => !API_KEY_SCOPES.includes(scope)
    );

    if (invalidScopes.length > 0) {
        const error = new Error(
            `Invalid API key scope: ${invalidScopes.join(", ")}`
        );

        error.status = 400;
        error.code = "INVALID_API_KEY_SCOPE";

        throw error;
    }

    return uniqueScopes;
}

function validateExpiry(expiresAt) {
    if (expiresAt === null || expiresAt === undefined) {
        return null;
    }

    if (
        typeof expiresAt !== "string" ||
        Number.isNaN(Date.parse(expiresAt))
    ) {
        const error = new Error(
            "expiresAt must be a valid ISO-8601 date."
        );

        error.status = 400;
        error.code = "INVALID_API_KEY_EXPIRY";

        throw error;
    }

    const expiry = new Date(expiresAt);

    if (expiry <= new Date()) {
        const error = new Error(
            "API key expiry must be in the future."
        );

        error.status = 400;
        error.code = "API_KEY_EXPIRY_IN_PAST";

        throw error;
    }

    return expiry.toISOString();
}

export function createUserApiKey({
    userId,
    name,
    scopes,
    expiresAt = null
}) {
    const normalizedName = normalizeName(name);

    if (!normalizedName) {
        const error = new Error(
            "API key name is required."
        );

        error.status = 400;
        error.code = "API_KEY_NAME_REQUIRED";

        throw error;
    }

    if (normalizedName.length > MAX_NAME_LENGTH) {
        const error = new Error(
            `API key name cannot exceed ${MAX_NAME_LENGTH} characters.`
        );

        error.status = 400;
        error.code = "API_KEY_NAME_TOO_LONG";

        throw error;
    }

    const user = findUserById(userId);

    if (!user) {
        const error = new Error("User not found.");

        error.status = 404;
        error.code = "USER_NOT_FOUND";

        throw error;
    }

    if (user.status !== "active") {
        const error = new Error(
            "Only active users can create API keys."
        );

        error.status = 403;
        error.code = "USER_INACTIVE";

        throw error;
    }

    const existing =
        findApiKeyByUserAndName(
            userId,
            normalizedName
        );

    if (existing) {
        const error = new Error(
            "An API key with this name already exists."
        );

        error.status = 409;
        error.code = "API_KEY_NAME_EXISTS";

        throw error;
    }

    const normalizedScopes =
        validateScopes(scopes);

    const normalizedExpiry =
        validateExpiry(expiresAt);

    const secret = generateSecret();

    const apiKey = createApiKey({
        id: crypto.randomUUID(),
        userId,
        name: normalizedName,
        keyPrefix: `cdm_${secret.slice(0, 8)}`,
        keyHash: hashSecret(secret),
        scopes: normalizedScopes,
        expiresAt: normalizedExpiry
    });

    return {
        apiKey,
        key: `cdm_${secret}`
    };
}

export function getUserApiKeys(userId) {
    return listApiKeysByUser(userId);
}

export function revokeUserApiKey({
    apiKeyId,
    actorUserId,
    actorRole
}) {
    const apiKey = findApiKeyById(apiKeyId);

    if (!apiKey) {
        const error = new Error(
            "API key not found."
        );

        error.status = 404;
        error.code = "API_KEY_NOT_FOUND";

        throw error;
    }

    if (
        apiKey.user_id !== actorUserId &&
        actorRole !== "admin"
    ) {
        const error = new Error(
            "You do not have permission to revoke this API key."
        );

        error.status = 403;
        error.code = "API_KEY_ACCESS_DENIED";

        throw error;
    }

    if (apiKey.revoked_at) {
        const error = new Error(
            "API key is already revoked."
        );

        error.status = 409;
        error.code = "API_KEY_ALREADY_REVOKED";

        throw error;
    }

    return revokeApiKey(apiKeyId);
}

export function authenticateApiKey(rawKey) {
    if (
        typeof rawKey !== "string" ||
        !rawKey.startsWith("cdm_") ||
        rawKey.length < 20
    ) {
        const error = new Error(
            "Invalid API key."
        );

        error.status = 401;
        error.code = "INVALID_API_KEY";

        throw error;
    }

    const keyHash =
        hashSecret(rawKey.slice(4));

    const apiKey =
        findApiKeyByHash(keyHash);

    if (!apiKey) {
        const error = new Error(
            "Invalid API key."
        );

        error.status = 401;
        error.code = "INVALID_API_KEY";

        throw error;
    }

    if (apiKey.revoked_at) {
        const error = new Error(
            "API key has been revoked."
        );

        error.status = 401;
        error.code = "API_KEY_REVOKED";

        throw error;
    }

    if (
        apiKey.expires_at &&
        new Date(apiKey.expires_at) <= new Date()
    ) {
        const error = new Error(
            "API key has expired."
        );

        error.status = 401;
        error.code = "API_KEY_EXPIRED";

        throw error;
    }

    if (apiKey.user.status !== "active") {
        const error = new Error(
            "User account is not active."
        );

        error.status = 401;
        error.code = "USER_INACTIVE";

        throw error;
    }

    updateLastUsedAt(apiKey.id);

    return apiKey;
}

export function hasScope(apiKey, requiredScope) {
    return apiKey?.scopes?.includes(requiredScope) === true;
}
