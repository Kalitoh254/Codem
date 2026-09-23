import * as service from "../services/learningProgressService.js";

export function enrollController(req, res, next) {
    try {
        res.status(201).json({
            success: true,
            data: service.enroll(
                req.user.id,
                req.params.courseId
            )
        });
    } catch (error) {
        next(error);
    }
}

export function getEnrollmentController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getEnrollment(
                req.user.id,
                req.params.courseId
            )
        });
    } catch (error) {
        next(error);
    }
}

export function updateProgressController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.markLessonProgress(
                req.user.id,
                req.params.lessonId,
                req.body.completed !== false
            )
        });
    } catch (error) {
        next(error);
    }
}

export function getProgressController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getCourseProgress(
                req.user.id,
                req.params.courseId
            )
        });
    } catch (error) {
        next(error);
    }
}
