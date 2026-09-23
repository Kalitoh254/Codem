import app from "./app.js";
import env from "./config/env.js";
import { runMigrations } from "./database/migrate.js";

runMigrations();

const server = app.listen(env.port, () => {
    console.log(`
Codem API
--------------------------------
Environment : ${env.nodeEnv}
Version     : ${env.appVersion}
Port        : ${env.port}
Health      : http://127.0.0.1:${env.port}/api/v1/health
--------------------------------
`);
});

function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down...`);

    server.close(() => {
        console.log("Codem API stopped.");
        process.exit(0);
    });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
