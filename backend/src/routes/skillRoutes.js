import { Router } from "express";

import {
    listSkillsController,
    getSkillController,
    createSkillController
} from "../controllers/skillController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

router.get("/", listSkillsController);

router.get("/:id", getSkillController);

router.post(
    "/",
    requireAuth,
    requireRole("admin"),
    createSkillController
);

export default router;
