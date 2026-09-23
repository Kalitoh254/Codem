import {
    requestPasswordReset,
    validatePasswordResetToken,
    resetPassword
} from "../services/passwordResetService.js";

export function requestPasswordResetController(req, res, next) {
    try {
        const result = requestPasswordReset(
            req.body.email
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export function validatePasswordResetController(req, res, next) {
    try {
        const result = validatePasswordResetToken(
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

export function confirmPasswordResetController(req, res, next) {
    try {
        const result = resetPassword(
            req.body.token,
            req.body.newPassword
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
