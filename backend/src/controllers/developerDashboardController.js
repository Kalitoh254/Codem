import { getDeveloperDashboard } from "../services/developerDashboardService.js";

export function getDeveloperDashboardController(req, res, next) {
    try {
        res.json({
            success: true,
            data: getDeveloperDashboard(req.user.id)
        });
    } catch (error) {
        next(error);
    }
}
