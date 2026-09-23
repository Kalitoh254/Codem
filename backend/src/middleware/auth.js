import { authenticateToken } from "../services/authService.js";

export function requireAuth(req, _res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            const error = new Error(
                "Authentication required."
            );

            error.status = 401;
            error.code = "AUTHENTICATION_REQUIRED";

            throw error;
        }

        const parts = authorization.trim().split(/\s+/);

        if (
            parts.length !== 2 ||
            parts[0].toLowerCase() !== "bearer" ||
            !parts[1]
        ) {
            const error = new Error(
                "Use the Bearer authentication scheme."
            );

            error.status = 401;
            error.code = "INVALID_AUTHORIZATION_HEADER";

            throw error;
        }

        req.user = authenticateToken(parts[1]);

        next();
    } catch (error) {
        next(error);
    }
}
