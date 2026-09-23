import {
    createPost,
    getPosts,
    getPost,
    recordPostView,
    updatePost,
    deletePost,
    updatePostStatus
} from "../services/communityService.js";

export function createPostController(req, res, next) {
    try {
        const post = createPost(req.user.id, req.body);

        res.status(201).json({
            success: true,
            data: post
        });
    } catch (error) {
        next(error);
    }
}

export function listPostsController(req, res, next) {
    try {
        const posts = getPosts(req.query.type || null);

        res.status(200).json({
            success: true,
            data: posts
        });
    } catch (error) {
        next(error);
    }
}

export function getPostController(req, res, next) {
    try {
        const post = recordPostView(req.params.id);

        if (!post) {
            const error = new Error("Community post not found.");
            error.status = 404;
            error.code = "POST_NOT_FOUND";
            throw error;
        }

        res.status(200).json({
            success: true,
            data: post
        });
    } catch (error) {
        next(error);
    }
}

export function updatePostController(req, res, next) {
    try {
        const post = updatePost(req.params.id, req.body);

        res.status(200).json({
            success: true,
            data: post
        });
    } catch (error) {
        next(error);
    }
}

export function updatePostStatusController(req, res, next) {
    try {
        const post = updatePostStatus(
            req.params.id,
            req.body.status
        );

        res.status(200).json({
            success: true,
            data: post
        });
    } catch (error) {
        next(error);
    }
}

export function deletePostController(req, res, next) {
    try {
        deletePost(req.params.id);

        res.status(200).json({
            success: true,
            data: {
                message: "Community post deleted successfully."
            }
        });
    } catch (error) {
        next(error);
    }
}
