export function requireSelf(req, res, next) {
    return requireSelfByParam("id")(req, res, next);
}

export function requireSelfByParam(paramName) {
    return (req, res, next) => {
        try {
            const targetUserId = req.params[paramName];

            if (!targetUserId) {
                const error = new Error(
                    "User identifier is required."
                );
                error.status = 400;
                error.code = "USER_ID_REQUIRED";
                throw error;
            }

            if (targetUserId !== req.user.id) {
                const error = new Error(
                    "You can only modify your own resources."
                );
                error.status = 403;
                error.code = "RESOURCE_ACCESS_DENIED";
                throw error;
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}
