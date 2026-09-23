import { Router } from "express";

import {
    listNotificationsController,
    getNotificationController,
    markNotificationReadController,
    markAllNotificationsReadController,
    deleteNotificationController,
    unreadNotificationCountController
} from "../controllers/notificationController.js";

import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get(
    "/",
    listNotificationsController
);

router.get(
    "/unread-count",
    unreadNotificationCountController
);

router.get(
    "/:id",
    getNotificationController
);

router.patch(
    "/:id/read",
    markNotificationReadController
);

router.patch(
    "/read-all",
    markAllNotificationsReadController
);

router.delete(
    "/:id",
    deleteNotificationController
);

export default router;
