import {
    searchCommunityPosts,
    countCommunityPosts
} from "../repositories/communitySearchRepository.js";

const MAX_LIMIT = 50;

export function searchPosts({
    query = "",
    postType = null,
    status = null,
    tag = null,
    page = 1,
    limit = 20
}) {
    if (typeof query !== "string") {
        query = "";
    }

    query = query.trim();

    if (postType !== null && typeof postType !== "string") {
        const error = new Error("Invalid post type.");
        error.status = 400;
        error.code = "INVALID_POST_TYPE";
        throw error;
    }

    if (status !== null && typeof status !== "string") {
        const error = new Error("Invalid post status.");
        error.status = 400;
        error.code = "INVALID_POST_STATUS";
        throw error;
    }

    if (tag !== null && typeof tag !== "string") {
        const error = new Error("Invalid tag.");
        error.status = 400;
        error.code = "INVALID_TAG";
        throw error;
    }

    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) {
        page = 1;
    }

    if (!Number.isInteger(limit) || limit < 1) {
        limit = 20;
    }

    if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }

    const offset = (page - 1) * limit;

    const filters = {
        query,
        postType,
        status,
        tag
    };

    const posts = searchCommunityPosts({
        ...filters,
        limit,
        offset
    });

    const total = countCommunityPosts(filters);

    return {
        posts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}
