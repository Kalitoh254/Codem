import env from "../config/env.js";

export function healthController(_req, res) {
    res.status(200).json({
        success: true,
        data: {
            name: env.appName,
            version: env.appVersion,
            environment: env.nodeEnv,
            status: "operational",
            timestamp: new Date().toISOString()
        }
    });
}
