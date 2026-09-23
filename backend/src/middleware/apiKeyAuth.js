import {
    authenticateApiKey,
    hasScope
} from "../services/apiKeyService.js";

export function requireApiKey(req, _res, next) {
    try {
        const rawKey = req.headers["x-api-key"];

        if (!rawKey) {
            const error = new Error(
                "API key authentication required."
            );

            error.status = 401;
            error.code = "API_KEY_REQUIRED";

            throw error;
        }

        const apiKey =
            authenticateApiKey(rawKey);

        req.apiKey = apiKey;
        req.user = {
            id: apiKey.user.id,
            email: apiKey.user.email,
            username: apiKey.user.username,
            role: apiKey.user.role,
            status: apiKey.user.status,
            email_verified: apiKey.user.email_verified
        };
        req.authType = "api_key";

        next();
    } catch (error) {
        next(error);
    }
}

export function requireScope(...requiredScopes) {
    return (req, _res, next) => {
        try {
            if (!req.apiKey) {
                const error = new Error(
                    "API key authentication required."
                );

                error.status = 401;
                error.code = "API_KEY_REQUIRED";

                throw error;
            }

            const allowed =
                requiredScopes.some(scope =>
                    hasScope(req.apiKey, scope)
                );

            if (!allowed) {
                const error = new Error(
                    "API key does not have the required scope."
                );

                error.status = 403;
                error.code = "INSUFFICIENT_API_KEY_SCOPE";

                throw error;
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}
