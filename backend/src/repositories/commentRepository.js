import db from "../database/db.js";

export function createComment({
    id,
    postId,
    authorId,
    parentCommentId = null,
    content
}) {
    db.prepare(`
        INSERT INTO comments (
            id,
            post_id,
            author_id,
            parent_comment_id,
            content
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(
        id,
        postId,
        authorId,
        parentCommentId,
        content
    );

    return findCommentById(id);
}

export function findCommentById(id) {
    return db.prepare(`
        SELECT
            c.*,
            u.username
        FROM comments c
        INNER JOIN users u
            ON u.id = c.author_id
        WHERE c.id = ?
    `).get(id);
}

export function listCommentsByPost(postId) {
    return db.prepare(`
        SELECT
            c.*,
            u.username
        FROM comments c
        INNER JOIN users u
            ON u.id = c.author_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    `).all(postId);
}

export function deleteComment(id) {
    const deleteBranch = (commentId) => {
        const children = db.prepare(`
            SELECT id
            FROM comments
            WHERE parent_comment_id = ?
        `).all(commentId);

        for (const child of children) {
            deleteBranch(child.id);
        }

        db.prepare(`
            DELETE FROM comments
            WHERE id = ?
        `).run(commentId);
    };

    db.exec("BEGIN");

    try {
        deleteBranch(id);
        db.exec("COMMIT");
    } catch (error) {
        db.exec("ROLLBACK");
        throw error;
    }
}
