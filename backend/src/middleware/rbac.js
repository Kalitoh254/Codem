export function requireRole(...allowedRoles) {
    return (req, _res, next) => {
        try {
            if (!req.user) {
                const error = new Error(
                    "Authentication required."
                );

                error.status = 401;
                error.code = "AUTHENTICATION_REQUIRED";

                throw error;
            }

            if (!allowedRoles.includes(req.user.role)) {
                const error = new Error(
                    "You do not have permission to perform this action."
                );

                error.status = 403;
                error.code = "INSUFFICIENT_PERMISSIONS";

                throw error;
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}
