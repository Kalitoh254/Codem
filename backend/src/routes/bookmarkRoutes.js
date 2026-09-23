import { Router } from "express";

import {
    createBookmarkController,
    deleteBookmarkController,
    listBookmarksController,
    getBookmarkStatusController
} from "../controllers/bookmarkController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireBookmarkOwnerOrAdmin } from "../middleware/bookmarkOwnership.js";

const router = Router();

router.use(requireAuth);

router.get(
    "/",
    listBookmarksController
);

router.get(
    "/post/:postId",
    getBookmarkStatusController
);

router.post(
    "/post/:postId",
    createBookmarkController
);

router.delete(
    "/:id",
    requireBookmarkOwnerOrAdmin,
    deleteBookmarkController
);

export default router;
