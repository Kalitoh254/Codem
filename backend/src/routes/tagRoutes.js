import { Router } from "express";

import {
    createTagController,
    listTagsController,
    getTagController,
    attachTagController,
    detachTagController,
    listPostTagsController
} from "../controllers/tagController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { requirePostOwnerOrAdmin } from "../middleware/postOwnership.js";

const router = Router();

router.get(
    "/",
    listTagsController
);

router.get(
    "/post/:postId",
    listPostTagsController
);

router.get(
    "/:id",
    getTagController
);

router.post(
    "/",
    requireAuth,
    requireRole("admin"),
    validateBody({
        name: {
            required: true,
            type: "string",
            minLength: 2,
            maxLength: 50
        }
    }),
    createTagController
);

router.post(
    "/post/:postId/:tagId",
    requireAuth,
    requirePostOwnerOrAdmin,
    attachTagController
);

router.delete(
    "/post/:postId/:tagId",
    requireAuth,
    requirePostOwnerOrAdmin,
    detachTagController
);

export default router;
