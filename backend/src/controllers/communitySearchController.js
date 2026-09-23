import { searchPosts } from "../services/communitySearchService.js";

export function searchCommunityController(req, res, next) {
    try {
        const result = searchPosts({
            query: req.query.q || "",
            postType: req.query.type || null,
            status: req.query.status || null,
            tag: req.query.tag || null,
            page: req.query.page || 1,
            limit: req.query.limit || 20
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
