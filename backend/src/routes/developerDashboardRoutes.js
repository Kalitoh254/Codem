import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    getDeveloperDashboardController
} from "../controllers/developerDashboardController.js";

const router = express.Router();

router.get(
    "/me/dashboard",
    requireAuth,
    getDeveloperDashboardController
);

export default router;
