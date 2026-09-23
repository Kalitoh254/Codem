import crypto from "node:crypto";
import db from "../database/db.js";

import {
    createBookmark,
    findBookmarkById,
    findBookmarkByUserAndPost,
    listUserBookmarks,
    deleteBookmark
} from "../repositories/bookmarkRepository.js";

function findPost(id) {
    return db.prepare(`
        SELECT *
        FROM community_posts
        WHERE id = ?
    `).get(id);
}

export function addBookmark(userId, postId) {
    const post = findPost(postId);

    if (!post) {
        const error = new Error("Community post not found.");
        error.status = 404;
        error.code = "POST_NOT_FOUND";
        throw error;
    }

    const existing = findBookmarkByUserAndPost(
        userId,
        postId
    );

    if (existing) {
        const error = new Error(
            "You have already bookmarked this post."
        );
        error.status = 409;
        error.code = "BOOKMARK_ALREADY_EXISTS";
        throw error;
    }

    return createBookmark({
        id: crypto.randomUUID(),
        userId,
        postId
    });
}

export function removeBookmark(id) {
    const bookmark = findBookmarkById(id);

    if (!bookmark) {
        const error = new Error("Bookmark not found.");
        error.status = 404;
        error.code = "BOOKMARK_NOT_FOUND";
        throw error;
    }

    deleteBookmark(id);

    return true;
}

export function getUserBookmarks(userId) {
    return listUserBookmarks(userId);
}

export function getPostBookmarkStatus(
    userId,
    postId
) {
    const post = findPost(postId);

    if (!post) {
        const error = new Error("Community post not found.");
        error.status = 404;
        error.code = "POST_NOT_FOUND";
        throw error;
    }

    const bookmark = findBookmarkByUserAndPost(
        userId,
        postId
    );

    return {
        bookmarked: Boolean(bookmark),
        bookmark: bookmark || null
    };
}
