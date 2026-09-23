import { Router } from "express";

import {
    registerController,
    loginController,
    logoutController,
    meController
} from "../controllers/authController.js";

import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { authRateLimit } from "../middleware/rateLimit.js";

const router = Router();

router.post(
    "/register",
    authRateLimit,
    validateBody({
        email: {
            required: true,
            type: "string",
            minLength: 5,
            maxLength: 254
        },
        username: {
            required: true,
            type: "string",
            minLength: 3,
            maxLength: 30
        },
        password: {
            required: true,
            type: "string",
            minLength: 8,
            maxLength: 128
        },
        displayName: {
            required: false,
            type: "string",
            maxLength: 100
        }
    }),
    registerController
);

router.post(
    "/login",
    authRateLimit,
    validateBody({
        email: {
            required: true,
            type: "string",
            minLength: 5,
            maxLength: 254
        },
        password: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 128
        }
    }),
    loginController
);

router.post(
    "/logout",
    requireAuth,
    logoutController
);

router.get(
    "/me",
    requireAuth,
    meController
);

export default router;
