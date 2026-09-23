import db from "../database/db.js";

export function createReaction({
    id,
    userId,
    postId = null,
    commentId = null,
    reactionType = "like"
}) {
    db.prepare(`
        INSERT INTO reactions (
            id,
            user_id,
            post_id,
            comment_id,
            reaction_type
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(
        id,
        userId,
        postId,
        commentId,
        reactionType
    );

    return findReactionById(id);
}

export function findReactionById(id) {
    return db.prepare(`
        SELECT *
        FROM reactions
        WHERE id = ?
    `).get(id);
}

export function findPostReaction(
    userId,
    postId,
    reactionType = "like"
) {
    return db.prepare(`
        SELECT *
        FROM reactions
        WHERE user_id = ?
        AND post_id = ?
        AND reaction_type = ?
    `).get(
        userId,
        postId,
        reactionType
    );
}

export function findCommentReaction(
    userId,
    commentId,
    reactionType = "like"
) {
    return db.prepare(`
        SELECT *
        FROM reactions
        WHERE user_id = ?
        AND comment_id = ?
        AND reaction_type = ?
    `).get(
        userId,
        commentId,
        reactionType
    );
}

export function deleteReaction(id) {
    db.prepare(`
        DELETE FROM reactions
        WHERE id = ?
    `).run(id);
}

export function listPostReactions(postId) {
    return db.prepare(`
        SELECT
            reaction_type,
            COUNT(*) AS count
        FROM reactions
        WHERE post_id = ?
        GROUP BY reaction_type
        ORDER BY reaction_type ASC
    `).all(postId);
}

export function listCommentReactions(commentId) {
    return db.prepare(`
        SELECT
            reaction_type,
            COUNT(*) AS count
        FROM reactions
        WHERE comment_id = ?
        GROUP BY reaction_type
        ORDER BY reaction_type ASC
    `).all(commentId);
}
