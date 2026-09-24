import * as service from "../services/moduleService.js";

export function listModulesController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getModules(req.params.courseId)
        });
    } catch (error) {
        next(error);
    }
}

export function getModuleController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getModule(req.params.id)
        });
    } catch (error) {
        next(error);
    }
}

export function createModuleController(req, res, next) {
    try {
        res.status(201).json({
            success: true,
            data: service.createNewModule(
                req.params.courseId,
                req.body
            )
        });
    } catch (error) {
        next(error);
    }
}

export function updateModuleController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.editModule(
                req.params.id,
                req.body
            )
        });
    } catch (error) {
        next(error);
    }
}

export function deleteModuleController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.removeModule(req.params.id)
        });
    } catch (error) {
        next(error);
    }
}
