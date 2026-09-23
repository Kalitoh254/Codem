export function errorHandler(err, _req, res, _next) {
    const status = err.status || 500;

    if (status >= 500) {
        console.error(err);
    } else {
        console.warn(
            `[${status}] ${err.code || "REQUEST_ERROR"}: ${err.message || "Request failed."}`
        );
    }

    res.status(status).json({
        success: false,
        error: {
            code:
                err.code ||
                "INTERNAL_SERVER_ERROR",
            message:
                status >= 400 &&
                status < 500 &&
                err.message
                    ? err.message
                    : "An unexpected server error occurred."
        }
    });
}
