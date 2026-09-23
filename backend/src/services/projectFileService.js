import crypto from "node:crypto";
import {
    listProjectFiles,
    findProjectFile,
    createProjectFile,
    updateProjectFile,
    deleteProjectFile
} from "../repositories/projectFileRepository.js";
import db from "../database/db.js";

function assertProject(projectId) {
    const project = db.prepare(
        "SELECT id FROM projects WHERE id = ?"
    ).get(projectId);

    if (!project) {
        const error = new Error("Project not found.");
        error.status = 404;
        error.code = "PROJECT_NOT_FOUND";
        throw error;
    }
}

function normalizePath(input) {
    if (typeof input !== "string") {
        throw Object.assign(
            new Error("File path must be a string."),
            { status: 400, code: "INVALID_FILE_PATH" }
        );
    }

    const value = input.trim().replaceAll("\\", "/");

    if (
        !value ||
        value.startsWith("/") ||
        value.includes("\0") ||
        value.split("/").includes("..") ||
        value.includes("//")
    ) {
        throw Object.assign(
            new Error("Invalid project file path."),
            { status: 400, code: "INVALID_FILE_PATH" }
        );
    }

    if (value.length > 500) {
        throw Object.assign(
            new Error("Project file path is too long."),
            { status: 400, code: "FILE_PATH_TOO_LONG" }
        );
    }

    return value;
}

export function getFiles(projectId) {
    assertProject(projectId);
    return listProjectFiles(projectId);
}

export function getFile(projectId, fileId) {
    assertProject(projectId);

    const file = findProjectFile(fileId, projectId);

    if (!file) {
        throw Object.assign(
            new Error("Project file not found."),
            { status: 404, code: "FILE_NOT_FOUND" }
        );
    }

    return file;
}

export function addFile(projectId, data) {
    assertProject(projectId);

    const path = normalizePath(data.path);
    const content = typeof data.content === "string"
        ? data.content
        : "";

    if (content.length > 1_000_000) {
        throw Object.assign(
            new Error("Project file is too large."),
            { status: 413, code: "FILE_TOO_LARGE" }
        );
    }

    const duplicate = db.prepare(`
        SELECT id
        FROM project_files
        WHERE project_id = ? AND path = ?
    `).get(projectId, path);

    if (duplicate) {
        throw Object.assign(
            new Error("A file with this path already exists."),
            { status: 409, code: "FILE_ALREADY_EXISTS" }
        );
    }

    return createProjectFile({
        id: crypto.randomUUID(),
        projectId,
        path,
        content
    });
}

export function editFile(projectId, fileId, data) {
    const file = getFile(projectId, fileId);

    const update = {};

    if (data.path !== undefined) {
        update.path = normalizePath(data.path);

        const duplicate = db.prepare(`
            SELECT id
            FROM project_files
            WHERE project_id = ?
            AND path = ?
            AND id != ?
        `).get(projectId, update.path, fileId);

        if (duplicate) {
            throw Object.assign(
                new Error("A file with this path already exists."),
                { status: 409, code: "FILE_ALREADY_EXISTS" }
            );
        }
    }

    if (data.content !== undefined) {
        if (
            typeof data.content !== "string" ||
            data.content.length > 1_000_000
        ) {
            throw Object.assign(
                new Error("Invalid or oversized file content."),
                { status: 413, code: "FILE_TOO_LARGE" }
            );
        }

        update.content = data.content;
    }

    return updateProjectFile(fileId, projectId, update);
}

export function removeFile(projectId, fileId) {
    getFile(projectId, fileId);

    deleteProjectFile(fileId, projectId);

    return { deleted: true };
}
