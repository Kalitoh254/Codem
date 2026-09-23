import rateLimit from "express-rate-limit";

function userKeyGenerator(req) {
    if (req.user?.id) {
        return `user:${req.user.id}`;
    }

    return `ip:${req.ip}`;
}

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            error: {
                code: "RATE_LIMIT_EXCEEDED",
                message:
                    "Too many authentication requests. Please try again later."
            }
        });
    }
});

export const submissionRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    keyGenerator: userKeyGenerator,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            error: {
                code: "SUBMISSION_RATE_LIMIT_EXCEEDED",
                message:
                    "Too many submissions. Please wait before submitting again."
            }
        });
    }
});
