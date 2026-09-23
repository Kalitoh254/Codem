import * as service from "../services/challengeService.js";

export function listChallengesController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getChallenges(req.query)
        });
    } catch (error) {
        next(error);
    }
}

export function getChallengeController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getChallenge(req.params.id)
        });
    } catch (error) {
        next(error);
    }
}

export function createChallengeController(req, res, next) {
    try {
        res.status(201).json({
            success: true,
            data: service.createNewChallenge(req.body)
        });
    } catch (error) {
        next(error);
    }
}

export function updateChallengeController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.editChallenge(
                req.params.id,
                req.body
            )
        });
    } catch (error) {
        next(error);
    }
}

export function deleteChallengeController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.removeChallenge(req.params.id)
        });
    } catch (error) {
        next(error);
    }
}
