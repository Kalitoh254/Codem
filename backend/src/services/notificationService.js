import crypto from "node:crypto";

import {
    createNotification,
    findNotificationById,
    listUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    countUnreadNotifications
} from "../repositories/notificationRepository.js";

export function notify({
    userId,
    type,
    title,
    message,
    referenceType = null,
    referenceId = null
}) {
    if (!userId) {
        const error = new Error("Notification recipient is required.");
        error.status = 400;
        error.code = "NOTIFICATION_RECIPIENT_REQUIRED";
        throw error;
    }

    if (!type || !title || !message) {
        const error = new Error(
            "Notification type, title, and message are required."
        );
        error.status = 400;
        error.code = "INVALID_NOTIFICATION";
        throw error;
    }

    return createNotification({
        id: crypto.randomUUID(),
        userId,
        type,
        title,
        message,
        referenceType,
        referenceId
    });
}

export function getNotification(id, userId) {
    const notification = findNotificationById(id);

    if (!notification) {
        const error = new Error("Notification not found.");
        error.status = 404;
        error.code = "NOTIFICATION_NOT_FOUND";
        throw error;
    }

    if (notification.user_id !== userId) {
        const error = new Error(
            "You do not have permission to access this notification."
        );
        error.status = 403;
        error.code = "NOTIFICATION_ACCESS_DENIED";
        throw error;
    }

    return notification;
}

export function getUserNotifications(userId) {
    return listUserNotifications(userId);
}

export function readNotification(id, userId) {
    const notification = getNotification(id, userId);

    if (!notification.is_read) {
        return markNotificationAsRead(id, userId);
    }

    return notification;
}

export function readAllNotifications(userId) {
    markAllNotificationsAsRead(userId);

    return {
        message: "All notifications marked as read."
    };
}

export function removeNotification(id, userId) {
    getNotification(id, userId);

    deleteNotification(id, userId);

    return {
        message: "Notification deleted successfully."
    };
}

export function getUnreadNotificationCount(userId) {
    return {
        count: countUnreadNotifications(userId)
    };
}
