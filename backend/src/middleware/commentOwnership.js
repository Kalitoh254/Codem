import { findCommentById } from "../repositories/commentRepository.js";

export function requireCommentOwnerOrAdmin(req, res, next) {
    try {
        const comment = findCommentById(req.params.id);

        if (!comment) {
            const error = new Error("Comment not found.");
            error.status = 404;
            error.code = "COMMENT_NOT_FOUND";
            throw error;
        }

        if (
            comment.author_id !== req.user.id &&
            req.user.role !== "admin"
        ) {
            const error = new Error(
                "You do not have permission to modify this comment."
            );
            error.status = 403;
            error.code = "COMMENT_ACCESS_DENIED";
            throw error;
        }

        req.comment = comment;
        next();
    } catch (error) {
        next(error);
    }
}
