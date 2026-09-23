import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

import {
    listLessonsController,
    getLessonController,
    createLessonController,
    updateLessonController,
    deleteLessonController
} from "../controllers/lessonController.js";

const router = express.Router();

router.get("/course/:courseId", listLessonsController);
router.get("/:id", getLessonController);

router.post(
    "/course/:courseId",
    requireAuth,
    requireRole("admin"),
    createLessonController
);

router.patch(
    "/:id",
    requireAuth,
    requireRole("admin"),
    updateLessonController
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("admin"),
    deleteLessonController
);

export default router;
