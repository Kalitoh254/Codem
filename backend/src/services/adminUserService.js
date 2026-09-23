import {
    recordAuditEvent,
    AUDIT_ACTIONS
} from "./auditLogService.js";

import {
    listAdminUsers,
    countAdminUsers,
    findAdminUserById,
    updateUserRole,
    updateUserStatus,
    revokeUserSessions
} from "../repositories/adminUserRepository.js";

const ALLOWED_ROLES = new Set([
    "user",
    "admin"
]);

const ALLOWED_STATUSES = new Set([
    "active",
    "suspended"
]);

const MAX_LIMIT = 100;

function assertTargetUser(id) {
    const user = findAdminUserById(id);

    if (!user) {
        const error = new Error("User not found.");
        error.status = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
    }

    return user;
}

export function listUsers({
    search = "",
    role = null,
    status = null,
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

    if (role !== null && !ALLOWED_ROLES.has(role)) {
        const error = new Error("Invalid user role.");
        error.status = 400;
        error.code = "INVALID_ROLE";
        throw error;
    }

    if (status !== null && !ALLOWED_STATUSES.has(status)) {
        const error = new Error("Invalid user status.");
        error.status = 400;
        error.code = "INVALID_STATUS";
        throw error;
    }

    const offset = (page - 1) * limit;

    const filters = {
        search: typeof search === "string"
            ? search.trim()
            : "",
        role,
        status
    };

    const users = listAdminUsers({
        ...filters,
        limit,
        offset
    });

    const total = countAdminUsers(filters);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export function getUser(id) {
    return assertTargetUser(id);
}

export function changeRole({
    targetUserId,
    role,
    adminUserId,
    ipAddress = null,
    userAgent = null
}) {
    const user = assertTargetUser(targetUserId);

    if (!ALLOWED_ROLES.has(role)) {
        const error = new Error("Invalid user role.");
        error.status = 400;
        error.code = "INVALID_ROLE";
        throw error;
    }

    if (
        targetUserId === adminUserId &&
        role !== user.role
    ) {
        const error = new Error(
            "Administrators cannot change their own role."
        );

        error.status = 403;
        error.code = "SELF_ROLE_CHANGE_DENIED";
        throw error;
    }

    if (user.role === role) {
        return user;
    }

    const previousRole = user.role;
    const updatedUser = updateUserRole(
        targetUserId,
        role
    );

    recordAuditEvent({
        userId: adminUserId,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        resourceType: "user",
        resourceId: targetUserId,
        ipAddress,
        userAgent,
        metadata: {
            previousRole,
            newRole: role
        }
    });

    return updatedUser;
}

export function changeStatus({
    targetUserId,
    status,
    adminUserId,
    ipAddress = null,
    userAgent = null
}) {
    const user = assertTargetUser(targetUserId);

    if (!ALLOWED_STATUSES.has(status)) {
        const error = new Error("Invalid user status.");
        error.status = 400;
        error.code = "INVALID_STATUS";
        throw error;
    }

    if (
        targetUserId === adminUserId &&
        status !== "active"
    ) {
        const error = new Error(
            "Administrators cannot suspend their own account."
        );

        error.status = 403;
        error.code = "SELF_SUSPENSION_DENIED";
        throw error;
    }

    if (user.status === status) {
        return user;
    }

    const previousStatus = user.status;
    const updatedUser = updateUserStatus(
        targetUserId,
        status
    );

    recordAuditEvent({
        userId: adminUserId,
        action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
        resourceType: "user",
        resourceId: targetUserId,
        ipAddress,
        userAgent,
        metadata: {
            previousStatus,
            newStatus: status
        }
    });

    return updatedUser;
}

export function forceLogout(
    targetUserId,
    adminUserId = null,
    ipAddress = null,
    userAgent = null
) {
    assertTargetUser(targetUserId);

    const result = revokeUserSessions(targetUserId);

    recordAuditEvent({
        userId: adminUserId,
        action: AUDIT_ACTIONS.USER_SESSIONS_REVOKED,
        resourceType: "user",
        resourceId: targetUserId,
        ipAddress,
        userAgent,
        metadata: {
            revokedSessions: result.changes
        }
    });

    return {
        revokedSessions: result.changes
    };
}
