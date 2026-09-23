import * as service from "../services/courseService.js";

export function createCourseController(req, res, next) {
    try {
        res.status(201).json({
            success: true,
            data: service.createNewCourse(req.body)
        });
    } catch (error) {
        next(error);
    }
}

export function listCoursesController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getCourses(req.query)
        });
    } catch (error) {
        next(error);
    }
}

export function getCourseController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getCourse(req.params.id)
        });
    } catch (error) {
        next(error);
    }
}

export function updateCourseController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.editCourse(req.params.id, req.body)
        });
    } catch (error) {
        next(error);
    }
}

export function deleteCourseController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.removeCourse(req.params.id)
        });
    } catch (error) {
        next(error);
    }
}
