import db from "../database/db.js";
import {
    listProjectMembers,
    findProjectMember,
    addProjectMember,
    updateProjectMember,
    removeProjectMember
} from "../repositories/projectMemberRepository.js";

const ROLES = new Set(["member", "maintainer", "collaborator"]);

function assertProject(projectId) {
    const project = db.prepare(
        "SELECT id, owner_id FROM projects WHERE id = ?"
    ).get(projectId);

    if (!project) {
        const error = new Error("Project not found.");
        error.status = 404;
        error.code = "PROJECT_NOT_FOUND";
        throw error;
    }

    return project;
}

function assertUser(userId) {
    const user = db.prepare(
        "SELECT id, status FROM users WHERE id = ?"
    ).get(userId);

    if (!user || user.status !== "active") {
        const error = new Error("User not found or inactive.");
        error.status = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
    }
}

export function getMembers(projectId) {
    assertProject(projectId);
    return listProjectMembers(projectId);
}

export function addMember(projectId, userId, role = "member") {
    const project = assertProject(projectId);
    assertUser(userId);

    if (!ROLES.has(role)) {
        const error = new Error("Invalid project member role.");
        error.status = 400;
        error.code = "INVALID_MEMBER_ROLE";
        throw error;
    }

    if (project.owner_id === userId) {
        const error = new Error("The project owner cannot be added as a member.");
        error.status = 409;
        error.code = "OWNER_ALREADY_MEMBER";
        throw error;
    }

    if (findProjectMember(projectId, userId)) {
        const error = new Error("User is already a project member.");
        error.status = 409;
        error.code = "MEMBER_ALREADY_EXISTS";
        throw error;
    }

    return addProjectMember({
        projectId,
        userId,
        role
    });
}

export function editMember(projectId, userId, role) {
    const project = assertProject(projectId);

    if (project.owner_id === userId) {
        const error = new Error("The project owner role cannot be changed.");
        error.status = 409;
        error.code = "OWNER_ROLE_PROTECTED";
        throw error;
    }

    if (!ROLES.has(role)) {
        const error = new Error("Invalid project member role.");
        error.status = 400;
        error.code = "INVALID_MEMBER_ROLE";
        throw error;
    }

    if (!findProjectMember(projectId, userId)) {
        const error = new Error("Project member not found.");
        error.status = 404;
        error.code = "MEMBER_NOT_FOUND";
        throw error;
    }

    return updateProjectMember(projectId, userId, role);
}

export function removeMember(projectId, userId) {
    const project = assertProject(projectId);

    if (project.owner_id === userId) {
        const error = new Error("The project owner cannot be removed.");
        error.status = 409;
        error.code = "OWNER_PROTECTED";
        throw error;
    }

    const result = removeProjectMember(projectId, userId);

    if (result.changes === 0) {
        const error = new Error("Project member not found.");
        error.status = 404;
        error.code = "MEMBER_NOT_FOUND";
        throw error;
    }

    return { removed: true };
}
