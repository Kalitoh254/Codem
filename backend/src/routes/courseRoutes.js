import express from "express";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";

import {
    createCourseController,
    listCoursesController,
    getCourseController,
    getCourseCurriculumController,
    updateCourseController,
    deleteCourseController
} from "../controllers/courseController.js";

const router = express.Router();

const courseValidation = {
    title: {
        required: true,
        type: "string",
        minLength: 2,
        maxLength: 200
    },
    description: {
        type: "string",
        maxLength: 10000
    },
    thumbnailUrl: {
        type: "string",
        maxLength: 2000
    },
    category: {
        type: "string",
        maxLength: 100
    },
    difficulty: {
        type: "string",
        enum: [
            "beginner",
            "intermediate",
            "advanced"
        ]
    },
    status: {
        type: "string",
        enum: [
            "draft",
            "published",
            "archived"
        ]
    },
    durationMinutes: {
        type: "number"
    },
    prerequisites: {
        type: "array",
        itemType: "string",
        maxItems: 50
    },
    learningOutcomes: {
        type: "array",
        itemType: "string",
        maxItems: 50
    }
};

router.get(
    "/",
    listCoursesController
);

router.get(
    "/:id/curriculum",
    getCourseCurriculumController
);

router.get(
    "/:id",
    getCourseController
);

router.post(
    "/",
    requireAuth,
    requireRole("admin"),
    validateBody(courseValidation),
    createCourseController
);

router.patch(
    "/:id",
    requireAuth,
    requireRole("admin"),
    validateBody({
        ...courseValidation,
        title: {
            ...courseValidation.title,
            required: false
        }
    }),
    updateCourseController
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("admin"),
    deleteCourseController
);

export default router;
