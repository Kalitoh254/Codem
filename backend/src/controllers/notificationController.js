import {
    getNotification,
    getUserNotifications,
    readNotification,
    readAllNotifications,
    removeNotification,
    getUnreadNotificationCount
} from "../services/notificationService.js";

export function listNotificationsController(req, res, next) {
    try {
        const notifications = getUserNotifications(req.user.id);

        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        next(error);
    }
}

export function getNotificationController(req, res, next) {
    try {
        const notification = getNotification(
            req.params.id,
            req.user.id
        );

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
}

export function markNotificationReadController(req, res, next) {
    try {
        const notification = readNotification(
            req.params.id,
            req.user.id
        );

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
}

export function markAllNotificationsReadController(req, res, next) {
    try {
        const result = readAllNotifications(req.user.id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export function deleteNotificationController(req, res, next) {
    try {
        const result = removeNotification(
            req.params.id,
            req.user.id
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export function unreadNotificationCountController(req, res, next) {
    try {
        const result = getUnreadNotificationCount(
            req.user.id
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
