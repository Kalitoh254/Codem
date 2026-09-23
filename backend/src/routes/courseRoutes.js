import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";

import {
    createCourseController,
    listCoursesController,
    getCourseController,
    updateCourseController,
    deleteCourseController
} from "../controllers/courseController.js";

const router = express.Router();

router.get("/", listCoursesController);
router.get("/:id", getCourseController);

router.post(
    "/",
    requireAuth,
    requireRole("admin"),
    validateBody({
        title: {
            required: true,
            type: "string",
            minLength: 2,
            maxLength: 200
        }
    }),
    createCourseController
);

router.patch(
    "/:id",
    requireAuth,
    requireRole("admin"),
    updateCourseController
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("admin"),
    deleteCourseController
);

export default router;
