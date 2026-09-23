import db from "../database/db.js";

function findPost(id) {
    return db.prepare(`
        SELECT *
        FROM community_posts
        WHERE id = ?
    `).get(id);
}

export function requirePostOwnerOrAdmin(req, res, next) {
    try {
        const postId =
            req.params.postId ||
            req.params.id;

        const post = findPost(postId);

        if (!post) {
            const error = new Error("Community post not found.");
            error.status = 404;
            error.code = "POST_NOT_FOUND";
            throw error;
        }

        if (
            post.author_id !== req.user.id &&
            req.user.role !== "admin"
        ) {
            const error = new Error(
                "You do not have permission to modify this community post."
            );
            error.status = 403;
            error.code = "POST_ACCESS_DENIED";
            throw error;
        }

        req.post = post;
        next();
    } catch (error) {
        next(error);
    }
}
