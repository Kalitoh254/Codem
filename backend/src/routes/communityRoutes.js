import { Router } from "express";

import {
    createPostController,
    listPostsController,
    getPostController,
    updatePostController,
    updatePostStatusController,
    deletePostController
} from "../controllers/communityController.js";

import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { requirePostOwnerOrAdmin } from "../middleware/postOwnership.js";
import { searchCommunityController } from "../controllers/communitySearchController.js";

const router = Router();

router.get(
    "/",
    listPostsController
);

router.get(
    "/search",
    searchCommunityController
);

router.get(
    "/:id",
    getPostController
);

router.post(
    "/",
    requireAuth,
    validateBody({
        title: {
            required: true,
            type: "string",
            minLength: 5,
            maxLength: 200
        },
        content: {
            required: true,
            type: "string",
            minLength: 10
        },
        postType: {
            required: false,
            type: "string"
        }
    }),
    createPostController
);

router.patch(
    "/:id/status",
    requireAuth,
    requirePostOwnerOrAdmin,
    validateBody({
        status: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 20
        }
    }),
    updatePostStatusController
);

router.patch(
    "/:id",
    requireAuth,
    requirePostOwnerOrAdmin,
    validateBody({
        title: {
            required: false,
            type: "string",
            minLength: 5,
            maxLength: 200
        },
        content: {
            required: false,
            type: "string",
            minLength: 10
        },
        postType: {
            required: false,
            type: "string"
        }
    }),
    updatePostController
);

router.delete(
    "/:id",
    requireAuth,
    requirePostOwnerOrAdmin,
    deletePostController
);

export default router;
