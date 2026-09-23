import {
    getProfile,
    updateUserProfile
} from "../services/profileService.js";

export function getProfileController(req, res, next) {
    try {
        const profile = getProfile(req.params.id);

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        next(error);
    }
}

export function updateProfileController(req, res, next) {
    try {
        const profile = updateUserProfile(
            req.params.id,
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
