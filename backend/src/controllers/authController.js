import {
    register,
    login,
    logout,
    logoutAll,
    authenticateToken
} from "../services/authService.js";

export async function registerController(req, res, next) {
    try {
        const result = await register(req.body);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export async function loginController(req, res, next) {
    try {
        const result = await login(
            req.body
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export function logoutController(req, res, next) {
    try {
        const authorization =
            req.headers.authorization || "";

        const token = authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : null;

        logout(token);

        res.status(200).json({
            success: true,
            data: {
                message: "Logged out successfully."
            }
        });
    } catch (error) {
        next(error);
    }
}

export function logoutAllController(req, res, next) {
    try {
        logoutAll(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                message: "All sessions have been revoked."
            }
        });
    } catch (error) {
        next(error);
    }
}

export function meController(req, res, next) {
    try {
        const user = authenticateToken(
            req.headers.authorization?.replace(
                /^Bearer\s+/i,
                ""
            )
        );

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}
