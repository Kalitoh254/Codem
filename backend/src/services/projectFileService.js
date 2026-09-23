import crypto from "node:crypto";

import {
    listProjectFiles,
    findProjectFile,
    createProjectFile,
    updateProjectFile,
    deleteProjectFile
} from "../repositories/projectFileRepository.js";

import db from "../database/db.js";

import {
    recordAuditEvent
} from "./auditLogService.js";

function assertProject(projectId) {
    const project = db.prepare(`
        SELECT id
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
}

function normalizePath(input) {
    if (
        typeof input !== "string"
    ) {
        throw Object.assign(
            new Error(
                "File path must be a string."
            ),
            {
                status: 400,
                code: "INVALID_FILE_PATH"
            }
        );
    }

    const value =
        input
            .trim()
            .replaceAll("\\", "/");

    if (
        !value ||
        value.startsWith("/") ||
        value.includes("\0") ||
        value.split("/").includes("..") ||
        value.includes("//")
    ) {
        throw Object.assign(
            new Error(
                "Invalid project file path."
            ),
            {
                status: 400,
                code: "INVALID_FILE_PATH"
            }
        );
    }

    if (value.length > 500) {
        throw Object.assign(
            new Error(
                "Project file path is too long."
            ),
            {
                status: 400,
                code: "FILE_PATH_TOO_LONG"
            }
        );
    }

    return value;
}

function normalizeLanguage(language) {
    if (
        language === undefined ||
        language === null ||
        language === ""
    ) {
        return null;
    }

    if (
        typeof language !== "string"
    ) {
        throw Object.assign(
            new Error(
                "File language must be a string."
            ),
            {
                status: 400,
                code: "INVALID_FILE_LANGUAGE"
            }
        );
    }

    const value =
        language.trim();

    if (value.length > 50) {
        throw Object.assign(
            new Error(
                "File language is too long."
            ),
            {
                status: 400,
                code: "INVALID_FILE_LANGUAGE"
            }
        );
    }

    return value || null;
}

function assertContent(content) {
    if (
        typeof content !== "string"
    ) {
        throw Object.assign(
            new Error(
                "File content must be a string."
            ),
            {
                status: 400,
                code: "INVALID_FILE_CONTENT"
            }
        );
    }

    if (
        content.length > 1_000_000
    ) {
        throw Object.assign(
            new Error(
                "Project file is too large."
            ),
            {
                status: 413,
                code: "FILE_TOO_LARGE"
            }
        );
    }

    return content;
}

export function getFiles(projectId) {
    assertProject(projectId);
    return listProjectFiles(projectId);
}

export function getFile(
    projectId,
    fileId
) {
    assertProject(projectId);

    const file =
        findProjectFile(
            fileId,
            projectId
        );

    if (!file) {
        throw Object.assign(
            new Error(
                "Project file not found."
            ),
            {
                status: 404,
                code: "FILE_NOT_FOUND"
            }
        );
    }

    return file;
}

export function addFile(
    projectId,
    data,
    auditContext = {}
) {
    assertProject(projectId);

    const path =
        normalizePath(data.path);

    const content =
        data.content === undefined
            ? ""
            : assertContent(data.content);

    const language =
        normalizeLanguage(
            data.language
        );

    const sizeBytes =
        Buffer.byteLength(
            content,
            "utf8"
        );

    const duplicate =
        db.prepare(`
            SELECT id
            FROM project_files
            WHERE project_id = ?
            AND path = ?
        `).get(
            projectId,
            path
        );

    if (duplicate) {
        throw Object.assign(
            new Error(
                "A file with this path already exists."
            ),
            {
                status: 409,
                code: "FILE_ALREADY_EXISTS"
            }
        );
    }

    const file =
        createProjectFile({
            id: crypto.randomUUID(),
            projectId,
            path,
            content,
            language,
            sizeBytes
        });

    recordAuditEvent({
        userId: auditContext.userId ?? null,
        action: "PROJECT_FILE_CREATED",
        resourceType: "project_file",
        resourceId: file.id,
        ipAddress: auditContext.ipAddress ?? null,
        userAgent: auditContext.userAgent ?? null,
        metadata: {
            projectId,
            path,
            language,
            sizeBytes
        }
    });

    return file;
}

export function editFile(
    projectId,
    fileId,
    data,
    auditContext = {}
) {
    const file =
        getFile(
            projectId,
            fileId
        );

    const update = {};

    if (
        data.path !== undefined
    ) {
        update.path =
            normalizePath(
                data.path
            );

        const duplicate =
            db.prepare(`
                SELECT id
                FROM project_files
                WHERE project_id = ?
                AND path = ?
                AND id != ?
            `).get(
                projectId,
                update.path,
                fileId
            );

        if (duplicate) {
            throw Object.assign(
                new Error(
                    "A file with this path already exists."
                ),
                {
                    status: 409,
                    code: "FILE_ALREADY_EXISTS"
                }
            );
        }
    }

    if (
        data.content !== undefined
    ) {
        update.content =
            assertContent(
                data.content
            );

        update.sizeBytes =
            Buffer.byteLength(
                update.content,
                "utf8"
            );
    }

    if (
        data.language !== undefined
    ) {
        update.language =
            normalizeLanguage(
                data.language
            );
    }

    const updated =
        updateProjectFile(
            fileId,
            projectId,
            update
        );

    recordAuditEvent({
        userId: auditContext.userId ?? null,
        action: "PROJECT_FILE_UPDATED",
        resourceType: "project_file",
        resourceId: fileId,
        ipAddress: auditContext.ipAddress ?? null,
        userAgent: auditContext.userAgent ?? null,
        metadata: {
            projectId,
            changedFields: Object.keys(update)
        }
    });

    return updated;
}

export function removeFile(
    projectId,
    fileId,
    auditContext = {}
) {
    const file =
        getFile(
            projectId,
            fileId
        );

    deleteProjectFile(
        fileId,
        projectId
    );

    recordAuditEvent({
        userId: auditContext.userId ?? null,
        action: "PROJECT_FILE_DELETED",
        resourceType: "project_file",
        resourceId: fileId,
        ipAddress: auditContext.ipAddress ?? null,
        userAgent: auditContext.userAgent ?? null,
        metadata: {
            projectId,
            path: file.path
        }
    });

    return {
        deleted: true
    };
}
