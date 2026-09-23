import {
    addComment,
    getComments,
    getComment,
    removeComment
} from "../services/commentService.js";

export function createCommentController(req, res, next) {
    try {
        const comment = addComment(
            req.user.id,
            req.params.postId,
            req.body.content,
            req.body.parentCommentId || null
        );

        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        next(error);
    }
}

export function listCommentsController(req, res, next) {
    try {
        const comments = getComments(req.params.postId);

        res.status(200).json({
            success: true,
            data: comments
        });
    } catch (error) {
        next(error);
    }
}

export function getCommentController(req, res, next) {
    try {
        const comment = getComment(req.params.id);

        if (!comment) {
            const error = new Error("Comment not found.");
            error.status = 404;
            error.code = "COMMENT_NOT_FOUND";
            throw error;
        }

        res.status(200).json({
            success: true,
            data: comment
        });
    } catch (error) {
        next(error);
    }
}

export function deleteCommentController(req, res, next) {
    try {
        removeComment(req.params.id);

        res.status(200).json({
            success: true,
            data: {
                message: "Comment deleted successfully."
            }
        });
    } catch (error) {
        next(error);
    }
}
