import { findBookmarkById } from "../repositories/bookmarkRepository.js";

export function requireBookmarkOwnerOrAdmin(req, res, next) {
    try {
        const bookmark = findBookmarkById(req.params.id);

        if (!bookmark) {
            const error = new Error("Bookmark not found.");
            error.status = 404;
            error.code = "BOOKMARK_NOT_FOUND";
            throw error;
        }

        if (
            bookmark.user_id !== req.user.id &&
            req.user.role !== "admin"
        ) {
            const error = new Error(
                "You do not have permission to remove this bookmark."
            );
            error.status = 403;
            error.code = "BOOKMARK_ACCESS_DENIED";
            throw error;
        }

        req.bookmark = bookmark;
        next();
    } catch (error) {
        next(error);
    }
}
