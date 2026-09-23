import crypto from "node:crypto";
import db from "../database/db.js";

import {
    createReaction,
    findPostReaction,
    findCommentReaction,
    deleteReaction,
    listPostReactions,
    listCommentReactions
} from "../repositories/reactionRepository.js";

import { getComment } from "./commentService.js";

function findPost(id) {
    return db.prepare(`
        SELECT *
        FROM community_posts
        WHERE id = ?
    `).get(id);
}

const ALLOWED_REACTION_TYPES = ["like"];

function validateReactionType(reactionType) {
    if (!ALLOWED_REACTION_TYPES.includes(reactionType)) {
        const error = new Error("Invalid reaction type.");
        error.status = 400;
        error.code = "INVALID_REACTION_TYPE";
        throw error;
    }
}

export function addPostReaction(
    userId,
    postId,
    reactionType = "like"
) {
    validateReactionType(reactionType);

    const post = findPost(postId);

    if (!post) {
        const error = new Error("Community post not found.");
        error.status = 404;
        error.code = "POST_NOT_FOUND";
        throw error;
    }

    const existing = findPostReaction(
        userId,
        postId,
        reactionType
    );

    if (existing) {
        const error = new Error(
            "You have already added this reaction."
        );
        error.status = 409;
        error.code = "REACTION_ALREADY_EXISTS";
        throw error;
    }

    return createReaction({
        id: crypto.randomUUID(),
        userId,
        postId,
        reactionType
    });
}

export function addCommentReaction(
    userId,
    commentId,
    reactionType = "like"
) {
    validateReactionType(reactionType);

    const comment = getComment(commentId);

    if (!comment) {
        const error = new Error("Comment not found.");
        error.status = 404;
        error.code = "COMMENT_NOT_FOUND";
        throw error;
    }

    const existing = findCommentReaction(
        userId,
        commentId,
        reactionType
    );

    if (existing) {
        const error = new Error(
            "You have already added this reaction."
        );
        error.status = 409;
        error.code = "REACTION_ALREADY_EXISTS";
        throw error;
    }

    return createReaction({
        id: crypto.randomUUID(),
        userId,
        commentId,
        reactionType
    });
}

export function removeReaction(id) {
    deleteReaction(id);
}

export function getPostReactionSummary(postId) {
    const post = findPost(postId);

    if (!post) {
        const error = new Error("Community post not found.");
        error.status = 404;
        error.code = "POST_NOT_FOUND";
        throw error;
    }

    return listPostReactions(postId);
}

export function getCommentReactionSummary(commentId) {
    const comment = getComment(commentId);

    if (!comment) {
        const error = new Error("Comment not found.");
        error.status = 404;
        error.code = "COMMENT_NOT_FOUND";
        throw error;
    }

    return listCommentReactions(commentId);
}
