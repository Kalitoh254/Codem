import crypto from "node:crypto";

import {
    createComment,
    findCommentById,
    listCommentsByPost,
    deleteComment
} from "../repositories/commentRepository.js";

import { getPost } from "./communityService.js";

export function addComment(authorId, postId, content, parentCommentId = null) {
    const post = getPost(postId);

    if (!post) {
        const error = new Error("Community post not found.");
        error.status = 404;
        error.code = "POST_NOT_FOUND";
        throw error;
    }

    if (parentCommentId) {
        const parentComment = findCommentById(parentCommentId);

        if (!parentComment) {
            const error = new Error("Parent comment not found.");
            error.status = 404;
            error.code = "PARENT_COMMENT_NOT_FOUND";
            throw error;
        }

        if (parentComment.post_id !== postId) {
            const error = new Error(
                "Parent comment does not belong to this community post."
            );
            error.status = 400;
            error.code = "INVALID_PARENT_COMMENT";
            throw error;
        }
    }

    const id = crypto.randomUUID();

    return createComment({
        id,
        postId,
        authorId,
        parentCommentId,
        content
    });
}

export function getComments(postId) {
    const post = getPost(postId);

    if (!post) {
        const error = new Error("Community post not found.");
        error.status = 404;
        error.code = "POST_NOT_FOUND";
        throw error;
    }

    return listCommentsByPost(postId);
}

export function getComment(id) {
    return findCommentById(id);
}

export function removeComment(id) {
    const comment = findCommentById(id);

    if (!comment) {
        const error = new Error("Comment not found.");
        error.status = 404;
        error.code = "COMMENT_NOT_FOUND";
        throw error;
    }

    deleteComment(id);

    return true;
}
