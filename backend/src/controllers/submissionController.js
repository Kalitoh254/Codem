import * as service from "../services/submissionService.js";

export function submitController(req, res, next) {
    try {
        res.status(201).json({
            success: true,
            data: service.submitChallenge(
                req.user.id,
                req.params.challengeId,
                req.body
            )
        });
    } catch (error) {
        next(error);
    }
}

export function getSubmissionController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getSubmission(
                req.user.id,
                req.params.id
            )
        });
    } catch (error) {
        next(error);
    }
}

export function listSubmissionsController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getMySubmissions(
                req.user.id,
                req.query.challengeId
            )
        });
    } catch (error) {
        next(error);
    }
}
