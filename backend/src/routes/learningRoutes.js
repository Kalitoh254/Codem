import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

import {
    enrollController,
    getEnrollmentController,
    updateProgressController,
    getProgressController
} from "../controllers/learningController.js";

const router = express.Router();

router.post(
    "/courses/:courseId/enroll",
    requireAuth,
    enrollController
);

router.get(
    "/courses/:courseId/enrollment",
    requireAuth,
    getEnrollmentController
);

router.get(
    "/courses/:courseId/progress",
    requireAuth,
    getProgressController
);

router.patch(
    "/lessons/:lessonId/progress",
    requireAuth,
    validateBody({
        completed: {
            required: false,
            type: "boolean"
        }
    }),
    updateProgressController
);

export default router;
