import db from "../database/db.js";

function findReaction(id) {
    return db.prepare(`
        SELECT *
        FROM reactions
        WHERE id = ?
    `).get(id);
}

export function requireReactionOwnerOrAdmin(req, res, next) {
    try {
        const reaction = findReaction(req.params.id);

        if (!reaction) {
            const error = new Error("Reaction not found.");
            error.status = 404;
            error.code = "REACTION_NOT_FOUND";
            throw error;
        }

        if (
            reaction.user_id !== req.user.id &&
            req.user.role !== "admin"
        ) {
            const error = new Error(
                "You do not have permission to remove this reaction."
            );
            error.status = 403;
            error.code = "REACTION_ACCESS_DENIED";
            throw error;
        }

        req.reaction = reaction;
        next();
    } catch (error) {
        next(error);
    }
}
