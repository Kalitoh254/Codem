import {
    requestEmailVerification,
    validateEmailVerificationToken,
    verifyEmail
} from "../services/emailVerificationService.js";

export function requestEmailVerificationController(req, res, next) {
    try {
        const result = requestEmailVerification(
            req.user.id
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export function validateEmailVerificationController(req, res, next) {
    try {
        const result = validateEmailVerificationToken(
            req.body.token
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export function verifyEmailController(req, res, next) {
    try {
        const result = verifyEmail(
            req.body.token
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
