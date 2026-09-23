import {
    addBookmark,
    removeBookmark,
    getUserBookmarks,
    getPostBookmarkStatus
} from "../services/bookmarkService.js";

export function createBookmarkController(req, res, next) {
    try {
        const bookmark = addBookmark(
            req.user.id,
            req.params.postId
        );

        res.status(201).json({
            success: true,
            data: bookmark
        });
    } catch (error) {
        next(error);
    }
}

export function deleteBookmarkController(req, res, next) {
    try {
        removeBookmark(req.params.id);

        res.status(200).json({
            success: true,
            data: {
                message: "Bookmark removed successfully."
            }
        });
    } catch (error) {
        next(error);
    }
}

export function listBookmarksController(req, res, next) {
    try {
        const bookmarks = getUserBookmarks(req.user.id);

        res.status(200).json({
            success: true,
            data: bookmarks
        });
    } catch (error) {
        next(error);
    }
}

export function getBookmarkStatusController(req, res, next) {
    try {
        const result = getPostBookmarkStatus(
            req.user.id,
            req.params.postId
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
