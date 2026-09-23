import crypto from "node:crypto";

import {
    createTag,
    findTagById,
    findTagBySlug,
    findTagByName,
    listTags,
    addTagToPost,
    removeTagFromPost,
    listPostTags
} from "../repositories/tagRepository.js";

import { getPost } from "./communityService.js";

function normalizeTagName(name) {
    return name.trim().replace(/\s+/g, " ");
}

function createSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function createNewTag(name) {
    if (!name || typeof name !== "string") {
        const error = new Error("Tag name is required.");
        error.status = 400;
        error.code = "TAG_NAME_REQUIRED";
        throw error;
    }

    const normalizedName = normalizeTagName(name);

    if (
        normalizedName.length < 2 ||
        normalizedName.length > 50
    ) {
        const error = new Error(
            "Tag name must be between 2 and 50 characters."
        );
        error.status = 400;
        error.code = "INVALID_TAG_NAME";
        throw error;
    }

    const slug = createSlug(normalizedName);

    if (!slug) {
        const error = new Error("Invalid tag name.");
        error.status = 400;
        error.code = "INVALID_TAG_NAME";
        throw error;
    }

    const existingByName = findTagByName(normalizedName);

    if (existingByName) {
        const error = new Error("Tag already exists.");
        error.status = 409;
        error.code = "TAG_ALREADY_EXISTS";
        throw error;
    }

    const existingBySlug = findTagBySlug(slug);

    if (existingBySlug) {
        const error = new Error("Tag slug already exists.");
        error.status = 409;
        error.code = "TAG_SLUG_ALREADY_EXISTS";
        throw error;
    }

    return createTag({
        id: crypto.randomUUID(),
        name: normalizedName,
        slug
    });
}

export function getTag(id) {
    return findTagById(id);
}

export function getTags() {
    return listTags();
}

export function attachTagToPost(postId, tagId) {
    const post = getPost(postId);

    if (!post) {
        const error = new Error("Community post not found.");
        error.status = 404;
        error.code = "POST_NOT_FOUND";
        throw error;
    }

    const tag = findTagById(tagId);

    if (!tag) {
        const error = new Error("Tag not found.");
        error.status = 404;
        error.code = "TAG_NOT_FOUND";
        throw error;
    }

    try {
        addTagToPost({
            postId,
            tagId
        });
    } catch (error) {
        if (
            error.message &&
            error.message.includes("UNIQUE constraint failed")
        ) {
            const duplicateError = new Error(
                "Tag is already attached to this post."
            );
            duplicateError.status = 409;
            duplicateError.code = "POST_TAG_ALREADY_EXISTS";
            throw duplicateError;
        }

        throw error;
    }

    return {
        postId,
        tag
    };
}

export function detachTagFromPost(postId, tagId) {
    removeTagFromPost({
        postId,
        tagId
    });

    return {
        postId,
        tagId
    };
}

export function getPostTags(postId) {
    const post = getPost(postId);

    if (!post) {
        const error = new Error("Community post not found.");
        error.status = 404;
        error.code = "POST_NOT_FOUND";
        throw error;
    }

    return listPostTags(postId);
}
