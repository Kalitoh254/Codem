import db from "../database/db.js";

export function createBookmark({
    id,
    userId,
    postId
}) {
    db.prepare(`
        INSERT INTO bookmarks (
            id,
            user_id,
            post_id
        )
        VALUES (?, ?, ?)
    `).run(
        id,
        userId,
        postId
    );

    return findBookmarkById(id);
}

export function findBookmarkById(id) {
    return db.prepare(`
        SELECT *
        FROM bookmarks
        WHERE id = ?
    `).get(id);
}

export function findBookmarkByUserAndPost(
    userId,
    postId
) {
    return db.prepare(`
        SELECT *
        FROM bookmarks
        WHERE user_id = ?
        AND post_id = ?
    `).get(
        userId,
        postId
    );
}

export function listUserBookmarks(userId) {
    return db.prepare(`
        SELECT
            b.id,
            b.user_id,
            b.post_id,
            b.created_at,
            p.title,
            p.content,
            p.post_type,
            p.status,
            p.view_count,
            p.created_at AS post_created_at,
            p.updated_at AS post_updated_at
        FROM bookmarks b
        INNER JOIN community_posts p
            ON p.id = b.post_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `).all(userId);
}

export function deleteBookmark(id) {
    db.prepare(`
        DELETE FROM bookmarks
        WHERE id = ?
    `).run(id);
}
