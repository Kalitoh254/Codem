import { Router } from "express";

import {
    createPostReactionController,
    createCommentReactionController,
    deleteReactionController,
    getPostReactionSummaryController,
    getCommentReactionSummaryController
} from "../controllers/reactionController.js";

import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { requireReactionOwnerOrAdmin } from "../middleware/reactionOwnership.js";

const router = Router();

router.get(
    "/post/:postId",
    getPostReactionSummaryController
);

router.get(
    "/comment/:commentId",
    getCommentReactionSummaryController
);

router.post(
    "/post/:postId",
    requireAuth,
    validateBody({
        reactionType: {
            required: false,
            type: "string",
            minLength: 1,
            maxLength: 30
        }
    }),
    createPostReactionController
);

router.post(
    "/comment/:commentId",
    requireAuth,
    validateBody({
        reactionType: {
            required: false,
            type: "string",
            minLength: 1,
            maxLength: 30
        }
    }),
    createCommentReactionController
);

router.delete(
    "/:id",
    requireAuth,
    requireReactionOwnerOrAdmin,
    deleteReactionController
);

export default router;
