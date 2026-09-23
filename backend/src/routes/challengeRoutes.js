import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

import {
    listChallengesController,
    getChallengeController,
    createChallengeController,
    updateChallengeController,
    deleteChallengeController
} from "../controllers/challengeController.js";

const router = express.Router();

router.get("/", listChallengesController);
router.get("/:id", getChallengeController);

router.post(
    "/",
    requireAuth,
    requireRole("admin"),
    createChallengeController
);

router.patch(
    "/:id",
    requireAuth,
    requireRole("admin"),
    updateChallengeController
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("admin"),
    deleteChallengeController
);

export default router;
