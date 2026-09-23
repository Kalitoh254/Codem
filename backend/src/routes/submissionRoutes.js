import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

import {
    submitController,
    getSubmissionController,
    listSubmissionsController
} from "../controllers/submissionController.js";

const router = express.Router();

router.get(
    "/",
    requireAuth,
    listSubmissionsController
);

router.get(
    "/:id",
    requireAuth,
    getSubmissionController
);

router.post(
    "/challenge/:challengeId",
    requireAuth,
    validateBody({
        code: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 500000
        },
        language: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 30
        }
    }),
    submitController
);

export default router;
