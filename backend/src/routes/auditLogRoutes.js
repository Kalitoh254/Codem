import { Router } from "express";

import {
    listAuditLogsController
} from "../controllers/auditLogController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/", listAuditLogsController);

export default router;
