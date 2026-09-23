import {
    createNewTag,
    getTag,
    getTags,
    attachTagToPost,
    detachTagFromPost,
    getPostTags
} from "../services/tagService.js";

export function createTagController(req, res, next) {
    try {
        const tag = createNewTag(req.body.name);

        res.status(201).json({
            success: true,
            data: tag
        });
    } catch (error) {
        next(error);
    }
}

export function listTagsController(req, res, next) {
    try {
        const tags = getTags();

        res.status(200).json({
            success: true,
            data: tags
        });
    } catch (error) {
        next(error);
    }
}

export function getTagController(req, res, next) {
    try {
        const tag = getTag(req.params.id);

        if (!tag) {
            const error = new Error("Tag not found.");
            error.status = 404;
            error.code = "TAG_NOT_FOUND";
            throw error;
        }

        res.status(200).json({
            success: true,
            data: tag
        });
    } catch (error) {
        next(error);
    }
}

export function attachTagController(req, res, next) {
    try {
        const result = attachTagToPost(
            req.params.postId,
            req.params.tagId
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export function detachTagController(req, res, next) {
    try {
        const result = detachTagFromPost(
            req.params.postId,
            req.params.tagId
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export function listPostTagsController(req, res, next) {
    try {
        const tags = getPostTags(req.params.postId);

        res.status(200).json({
            success: true,
            data: tags
        });
    } catch (error) {
        next(error);
    }
}
