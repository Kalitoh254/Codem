import { Router } from "express";

import {
    getDeveloperProfileController,
    updateDeveloperProfileController
} from "../controllers/developerProfileController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireSelfByParam } from "../middleware/ownership.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

router.get(
    "/:userId",
    requireAuth,
    getDeveloperProfileController
);

router.patch(
    "/:userId",
    requireAuth,
    requireSelfByParam("userId"),
    validateBody({
        display_name: {
            required: false,
            type: "string",
            maxLength: 100
        },
        bio: {
            required: false,
            type: "string",
            maxLength: 1000
        },
        avatar_url: {
            required: false,
            type: "string",
            maxLength: 500
        },
        location: {
            required: false,
            type: "string",
            maxLength: 150
        },
        website_url: {
            required: false,
            type: "string",
            maxLength: 500
        },
        github_url: {
            required: false,
            type: "string",
            maxLength: 500
        },
        linkedin_url: {
            required: false,
            type: "string",
            maxLength: 500
        },
    }),
    updateDeveloperProfileController
);

export default router;
