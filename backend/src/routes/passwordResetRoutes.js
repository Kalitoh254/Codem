import { Router } from "express";

import {
    requestPasswordResetController,
    validatePasswordResetController,
    confirmPasswordResetController
} from "../controllers/passwordResetController.js";

import { validateBody } from "../middleware/validate.js";
import { authRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.post(
    "/request",
    authRateLimit,
    validateBody({
        email: {
            required: true,
            type: "string",
            minLength: 5,
            maxLength: 254
        }
    }),
    requestPasswordResetController
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
    validatePasswordResetController
);

router.post(
    "/confirm",
    authRateLimit,
    validateBody({
        token: {
            required: true,
            type: "string",
            minLength: 32,
            maxLength: 128
        },
        newPassword: {
            required: true,
            type: "string",
            minLength: 8,
            maxLength: 128
        }
    }),
    confirmPasswordResetController
);

export default router;
