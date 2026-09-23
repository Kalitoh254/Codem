import { Router } from "express";

import {
    requestEmailVerificationController,
    validateEmailVerificationController,
    verifyEmailController
} from "../controllers/emailVerificationController.js";

import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { authRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.post(
    "/request",
    requireAuth,
    authRateLimit,
    requestEmailVerificationController
);

router.post(
    "/validate",
    authRateLimit,
    validateBody({
        token: {
            required: true,
            type: "string",
            minLength: 32,
            maxLength: 128
        }
    }),
    validateEmailVerificationController
);

router.post(
    "/verify",
    authRateLimit,
    validateBody({
        token: {
            required: true,
            type: "string",
            minLength: 32,
            maxLength: 128
        }
    }),
    verifyEmailController
);

export default router;
