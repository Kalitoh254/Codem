import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { requireProjectAccess, requireProjectOwnerOrAdmin } from "../middleware/projectOwnership.js";

import {
    listFilesController,
    getFileController,
    createFileController,
    updateFileController,
    deleteFileController
} from "../controllers/projectFileController.js";

const router = express.Router();

router.get(
    "/:projectId",
    requireAuth,
    requireProjectAccess,
    listFilesController
);

router.get(
    "/:projectId/:fileId",
    requireAuth,
    requireProjectAccess,
    getFileController
);

router.post(
    "/:projectId",
    requireAuth,
    requireProjectOwnerOrAdmin,
    validateBody({
        path: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 500
        },
        content: {
            required: false,
            type: "string",
            maxLength: 1000000
        }
    }),
    createFileController
);

router.patch(
    "/:projectId/:fileId",
    requireAuth,
    requireProjectOwnerOrAdmin,
    validateBody({
        path: {
            required: false,
            type: "string",
            maxLength: 500
        },
        content: {
            required: false,
            type: "string",
            maxLength: 1000000
        }
    }),
    updateFileController
);

router.delete(
    "/:projectId/:fileId",
    requireAuth,
    requireProjectOwnerOrAdmin,
    deleteFileController
);

export default router;
