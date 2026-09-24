import express from "express";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";

import {
    listModulesController,
    getModuleController,
    createModuleController,
    updateModuleController,
    deleteModuleController
} from "../controllers/moduleController.js";

const router = express.Router();

router.get(
    "/course/:courseId",
    listModulesController
);

router.get(
    "/:id",
    getModuleController
);

router.post(
    "/course/:courseId",
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
    createModuleController
);

router.patch(
    "/:id",
    requireAuth,
    requireRole("admin"),
    updateModuleController
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("admin"),
    deleteModuleController
);

export default router;
