import db from "../database/db.js";

import {
    listProjectMembers,
    findProjectMember,
    addProjectMember,
    updateProjectMember,
    removeProjectMember
} from "../repositories/projectMemberRepository.js";

import {
    recordAuditEvent
} from "./auditLogService.js";

const ROLES = new Set([
    "admin",
    "editor",
    "viewer"
]);

function assertProject(projectId) {
    const project = db.prepare(`
        SELECT
            id,
            owner_id
        FROM projects
        WHERE id = ?
    `).get(projectId);

    if (!project) {
        throw Object.assign(
            new Error("Project not found."),
            {
                status: 404,
                code: "PROJECT_NOT_FOUND"
            }
        );
    }

    return project;
}

function assertUser(userId) {
    const user = db.prepare(`
        SELECT
            id,
            status
        FROM users
        WHERE id = ?
    `).get(userId);

    if (
        !user ||
        user.status !== "active"
    ) {
        throw Object.assign(
            new Error(
                "User not found or inactive."
            ),
            {
                status: 404,
                code: "USER_NOT_FOUND"
            }
        );
    }
}

function assertRole(role) {
    const normalized =
        role || "viewer";

    if (!ROLES.has(normalized)) {
        throw Object.assign(
            new Error(
                "Invalid project member role."
            ),
            {
                status: 400,
                code: "INVALID_MEMBER_ROLE"
            }
        );
    }

    return normalized;
}

export function getMembers(projectId) {
    assertProject(projectId);
    return listProjectMembers(projectId);
}

export function addMember(
    projectId,
    userId,
    role = "viewer",
    auditContext = {}
) {
    const project =
        assertProject(projectId);

    assertUser(userId);

    role = assertRole(role);

    if (
        project.owner_id === userId
    ) {
        throw Object.assign(
            new Error(
                "The project owner cannot be added as a member."
            ),
            {
                status: 409,
                code: "OWNER_ALREADY_MEMBER"
            }
        );
    }

    if (
        findProjectMember(
            projectId,
            userId
        )
    ) {
        throw Object.assign(
            new Error(
                "User is already a project member."
            ),
            {
                status: 409,
                code: "MEMBER_ALREADY_EXISTS"
            }
        );
    }

    const member =
        addProjectMember({
            projectId,
            userId,
            role
        });

    recordAuditEvent({
        userId: auditContext.userId ?? null,
        action: "PROJECT_MEMBER_ADDED",
        resourceType: "project",
        resourceId: projectId,
        ipAddress: auditContext.ipAddress ?? null,
        userAgent: auditContext.userAgent ?? null,
        metadata: {
            memberUserId: userId,
            role
        }
    });

    return member;
}

export function editMember(
    projectId,
    userId,
    role,
    auditContext = {}
) {
    const project =
        assertProject(projectId);

    if (
        project.owner_id === userId
    ) {
        throw Object.assign(
            new Error(
                "The project owner role cannot be changed."
            ),
            {
                status: 409,
                code: "OWNER_ROLE_PROTECTED"
            }
        );
    }

    role = assertRole(role);

    if (
        !findProjectMember(
            projectId,
            userId
        )
    ) {
        throw Object.assign(
            new Error(
                "Project member not found."
            ),
            {
                status: 404,
                code: "MEMBER_NOT_FOUND"
            }
        );
    }

    const member =
        updateProjectMember(
            projectId,
            userId,
            role
        );

    recordAuditEvent({
        userId: auditContext.userId ?? null,
        action: "PROJECT_MEMBER_ROLE_CHANGED",
        resourceType: "project",
        resourceId: projectId,
        ipAddress: auditContext.ipAddress ?? null,
        userAgent: auditContext.userAgent ?? null,
        metadata: {
            memberUserId: userId,
            role
        }
    });

    return member;
}

export function removeMember(
    projectId,
    userId,
    auditContext = {}
) {
    const project =
        assertProject(projectId);

    if (
        project.owner_id === userId
    ) {
        throw Object.assign(
            new Error(
                "The project owner cannot be removed."
            ),
            {
                status: 409,
                code: "OWNER_PROTECTED"
            }
        );
    }

    const result =
        removeProjectMember(
            projectId,
            userId
        );

    if (result.changes === 0) {
        throw Object.assign(
            new Error(
                "Project member not found."
            ),
            {
                status: 404,
                code: "MEMBER_NOT_FOUND"
            }
        );
    }

    recordAuditEvent({
        userId: auditContext.userId ?? null,
        action: "PROJECT_MEMBER_REMOVED",
        resourceType: "project",
        resourceId: projectId,
        ipAddress: auditContext.ipAddress ?? null,
        userAgent: auditContext.userAgent ?? null,
        metadata: {
            memberUserId: userId
        }
    });

    return {
        removed: true
    };
}
