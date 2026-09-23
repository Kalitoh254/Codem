import "dotenv/config";

function parseCorsOrigins(value) {
    if (!value) {
        return [];
    }

    return value
        .split(",")
        .map(origin => origin.trim())
        .filter(Boolean);
}

const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 5000),
    appName: process.env.APP_NAME || "Codem",
    appVersion: process.env.APP_VERSION || "0.1.0",

    corsOrigins: parseCorsOrigins(
        process.env.CORS_ORIGINS
    )
};

export default env;
