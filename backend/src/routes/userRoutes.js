import { Router } from "express";

import {
    listUsersController,
    getUserController
} from "../controllers/userController.js";

import {
    getProfileController,
    updateProfileController
} from "../controllers/profileController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireSelf } from "../middleware/ownership.js";

const router = Router();

router.use(requireAuth);

router.get("/", listUsersController);

router.get("/:id", getUserController);

router.get("/:id/profile", getProfileController);

router.patch(
    "/:id/profile",
    requireSelf,
    updateProfileController
);

export default router;
