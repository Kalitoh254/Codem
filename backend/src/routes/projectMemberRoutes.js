import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { requireProjectAccess, requireProjectOwnerOrAdmin } from "../middleware/projectOwnership.js";

import {
    listMembersController,
    addMemberController,
    updateMemberController,
    deleteMemberController
} from "../controllers/projectMemberController.js";

const router = express.Router();

router.get(
    "/:projectId",
    requireAuth,
    requireProjectAccess,
    listMembersController
);

router.post(
    "/:projectId",
    requireAuth,
    requireProjectOwnerOrAdmin,
    validateBody({
        userId: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 100
        },
        role: {
            required: false,
            type: "string",
            maxLength: 30
        }
    }),
    addMemberController
);

router.patch(
    "/:projectId/:userId",
    requireAuth,
    requireProjectOwnerOrAdmin,
    validateBody({
        role: {
            required: true,
            type: "string",
            maxLength: 30
        }
    }),
    updateMemberController
);

router.delete(
    "/:projectId/:userId",
    requireAuth,
    requireProjectOwnerOrAdmin,
    deleteMemberController
);

export default router;
