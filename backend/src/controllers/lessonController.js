import * as service from "../services/lessonService.js";

export function listLessonsController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getLessons(req.params.courseId)
        });
    } catch (error) {
        next(error);
    }
}

export function listModuleLessonsController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getLessonsByModule(req.params.moduleId)
        });
    } catch (error) {
        next(error);
    }
}

export function getLessonController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getLesson(req.params.id)
        });
    } catch (error) {
        next(error);
    }
}

export function createLessonController(req, res, next) {
    try {
        res.status(201).json({
            success: true,
            data: service.createNewLesson(
                req.params.courseId,
                req.body
            )
        });
    } catch (error) {
        next(error);
    }
}

export function updateLessonController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.editLesson(
                req.params.id,
                req.body
            )
        });
    } catch (error) {
        next(error);
    }
}

export function deleteLessonController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.removeLesson(req.params.id)
        });
    } catch (error) {
        next(error);
    }
}
