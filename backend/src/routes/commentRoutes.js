import { Router } from "express";

import {
    createCommentController,
    listCommentsController,
    getCommentController,
    deleteCommentController
} from "../controllers/commentController.js";

import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { requireCommentOwnerOrAdmin } from "../middleware/commentOwnership.js";

const router = Router();

router.get(
    "/post/:postId",
    listCommentsController
);

router.get(
    "/:id",
    getCommentController
);

router.post(
    "/post/:postId",
    requireAuth,
    validateBody({
        content: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 5000
        },
        parentCommentId: {
            required: false,
            type: "string"
        }
    }),
    createCommentController
);

router.delete(
    "/:id",
    requireAuth,
    requireCommentOwnerOrAdmin,
    deleteCommentController
);

export default router;
