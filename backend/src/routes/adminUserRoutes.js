import { Router } from "express";

import {
    listAdminUsersController,
    getAdminUserController,
    changeUserRoleController,
    changeUserStatusController,
    revokeUserSessionsController
} from "../controllers/adminUserController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/", listAdminUsersController);

router.get("/:id", getAdminUserController);

router.patch("/:id/role", changeUserRoleController);

router.patch("/:id/status", changeUserStatusController);

router.post(
    "/:id/revoke-sessions",
    revokeUserSessionsController
);

export default router;
