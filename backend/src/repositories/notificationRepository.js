import db from "../database/db.js";

export function createNotification({
    id,
    userId,
    type,
    title,
    message,
    referenceType = null,
    referenceId = null
}) {
    db.prepare(`
        INSERT INTO notifications (
            id,
            user_id,
            type,
            title,
            message,
            reference_type,
            reference_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        userId,
        type,
        title,
        message,
        referenceType,
        referenceId
    );

    return findNotificationById(id);
}

export function findNotificationById(id) {
    return db.prepare(`
        SELECT
            id,
            user_id,
            type,
            title,
            message,
            reference_type,
            reference_id,
            is_read,
            created_at
        FROM notifications
        WHERE id = ?
    `).get(id);
}

export function listUserNotifications(userId) {
    return db.prepare(`
        SELECT
            id,
            user_id,
            type,
            title,
            message,
            reference_type,
            reference_id,
            is_read,
            created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).all(userId);
}

export function markNotificationAsRead(id, userId) {
    db.prepare(`
        UPDATE notifications
        SET is_read = 1
        WHERE id = ?
        AND user_id = ?
    `).run(id, userId);

    return findNotificationById(id);
}

export function markAllNotificationsAsRead(userId) {
    db.prepare(`
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = ?
        AND is_read = 0
    `).run(userId);
}

export function deleteNotification(id, userId) {
    db.prepare(`
        DELETE FROM notifications
        WHERE id = ?
        AND user_id = ?
    `).run(id, userId);
}

export function countUnreadNotifications(userId) {
    const result = db.prepare(`
        SELECT COUNT(*) AS count
        FROM notifications
        WHERE user_id = ?
        AND is_read = 0
    `).get(userId);

    return result.count;
}
