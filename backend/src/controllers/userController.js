import {
    getUserById,
    getUsers
} from "../services/userService.js";

function publicUser(user) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        email_verified: Boolean(user.email_verified),
        created_at: user.created_at,
        updated_at: user.updated_at
    };
}

export function listUsersController(req, res, next) {
    try {
        const users = getUsers({
            limit: req.query.limit,
            offset: req.query.offset
        });

        res.status(200).json({
            success: true,
            data: users.map(publicUser)
        });
    } catch (error) {
        next(error);
    }
}

export function getUserController(req, res, next) {
    try {
        const user = getUserById(req.params.id);

        res.status(200).json({
            success: true,
            data: publicUser(user)
        });
    } catch (error) {
        next(error);
    }
}
