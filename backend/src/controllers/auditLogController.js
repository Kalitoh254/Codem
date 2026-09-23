import {
    getAuditLogs
} from "../services/auditLogService.js";

export function listAuditLogsController(req, res, next) {
    try {
        const data = getAuditLogs({
            userId: req.query.userId || null,
            action: req.query.action || null,
            resourceType: req.query.resourceType || null,
            resourceId: req.query.resourceId || null,
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
