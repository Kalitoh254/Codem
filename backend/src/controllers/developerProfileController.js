import {
    getDeveloperProfile,
    updateDeveloperProfile
} from "../services/developerProfileService.js";

export function getDeveloperProfileController(req, res, next) {
    try {
        const profile = getDeveloperProfile(req.params.userId);

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        next(error);
    }
}

export function updateDeveloperProfileController(req, res, next) {
    try {
        const profile = updateDeveloperProfile(
            req.user.id,
            req.body
        );

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        next(error);
    }
}
