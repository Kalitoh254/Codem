import * as service from "../services/projectFileService.js";

export function listFilesController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getFiles(req.params.projectId)
        });
    } catch (error) {
        next(error);
    }
}

export function getFileController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getFile(
                req.params.projectId,
                req.params.fileId
            )
        });
    } catch (error) {
        next(error);
    }
}

export function createFileController(req, res, next) {
    try {
        res.status(201).json({
            success: true,
            data: service.addFile(
                req.params.projectId,
                req.body
            )
        });
    } catch (error) {
        next(error);
    }
}

export function updateFileController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.editFile(
                req.params.projectId,
                req.params.fileId,
                req.body
            )
        });
    } catch (error) {
        next(error);
    }
}

export function deleteFileController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.removeFile(
                req.params.projectId,
                req.params.fileId
            )
        });
    } catch (error) {
        next(error);
    }
}
