import {
    addPostReaction,
    addCommentReaction,
    removeReaction,
    getPostReactionSummary,
    getCommentReactionSummary
} from "../services/reactionService.js";

export function createPostReactionController(req, res, next) {
    try {
        const reaction = addPostReaction(
            req.user.id,
            req.params.postId,
            req.body.reactionType || "like"
        );

        res.status(201).json({
            success: true,
            data: reaction
        });
    } catch (error) {
        next(error);
    }
}

export function createCommentReactionController(req, res, next) {
    try {
        const reaction = addCommentReaction(
            req.user.id,
            req.params.commentId,
            req.body.reactionType || "like"
        );

        res.status(201).json({
            success: true,
            data: reaction
        });
    } catch (error) {
        next(error);
    }
}

export function deleteReactionController(req, res, next) {
    try {
        removeReaction(req.params.id);

        res.status(200).json({
            success: true,
            data: {
                message: "Reaction removed successfully."
            }
        });
    } catch (error) {
        next(error);
    }
}

export function getPostReactionSummaryController(req, res, next) {
    try {
        const reactions = getPostReactionSummary(
            req.params.postId
        );

        res.status(200).json({
            success: true,
            data: reactions
        });
    } catch (error) {
        next(error);
    }
}

export function getCommentReactionSummaryController(req, res, next) {
    try {
        const reactions = getCommentReactionSummary(
            req.params.commentId
        );

        res.status(200).json({
            success: true,
            data: reactions
        });
    } catch (error) {
        next(error);
    }
}
