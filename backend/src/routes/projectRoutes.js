import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
    requireProjectAccess,
    requireProjectOwnerOrAdmin
} from "../middleware/projectOwnership.js";

import {
    createProjectController,
    getProjectController,
    listMyProjectsController,
    listPublicProjectsController,
    updateProjectController,
    deleteProjectController
} from "../controllers/projectController.js";

const router = express.Router();

router.get("/public", listPublicProjectsController);

router.get(
    "/mine",
    requireAuth,
    listMyProjectsController
);

router.post(
    "/",
    requireAuth,
    validateBody({
        name: {
            required: true,
            type: "string",
            minLength: 2,
            maxLength: 150
        },
        description: {
            required: false,
            type: "string",
            maxLength: 5000
        },
        visibility: {
            required: false,
            type: "string",
            maxLength: 20
        }
    }),
    createProjectController
);

router.get(
    "/:id",
    requireAuth,
    requireProjectAccess,
    getProjectController
);

router.patch(
    "/:id",
    requireAuth,
    requireProjectOwnerOrAdmin,
    validateBody({
        name: {
            required: false,
            type: "string",
            minLength: 2,
            maxLength: 150
        },
        description: {
            required: false,
            type: "string",
            maxLength: 5000
        },
        visibility: {
            required: false,
            type: "string",
            maxLength: 20
        }
    }),
    updateProjectController
);

router.delete(
    "/:id",
    requireAuth,
    requireProjectOwnerOrAdmin,
    deleteProjectController
);

export default router;
