import {
    listUsers,
    getUser,
    changeRole,
    changeStatus,
    forceLogout
} from "../services/adminUserService.js";

export function listAdminUsersController(req, res, next) {
    try {
        const data = listUsers({
            search: req.query.search,
            role: req.query.role || null,
            status: req.query.status || null,
            page: req.query.page,
            limit: req.query.limit
        });

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
}

export function getAdminUserController(req, res, next) {
    try {
        const user = getUser(req.params.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}

export function changeUserRoleController(req, res, next) {
    try {
        const user = changeRole({
            targetUserId: req.params.id,
            role: req.body.role,
            adminUserId: req.user.id,
            ipAddress: req.ip,
            userAgent: req.get("user-agent") || null
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}

export function changeUserStatusController(req, res, next) {
    try {
        const user = changeStatus({
            targetUserId: req.params.id,
            status: req.body.status,
            adminUserId: req.user.id,
            ipAddress: req.ip,
            userAgent: req.get("user-agent") || null
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}

export function revokeUserSessionsController(req, res, next) {
    try {
        const result = forceLogout(
            req.params.id,
            req.user.id,
            req.ip,
            req.get("user-agent") || null
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
