import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsPath = path.resolve(
    __dirname,
    "../../../database/migrations"
);

export function runMigrations() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const migrations = fs
        .readdirSync(migrationsPath)
        .filter(file => file.endsWith(".sql"))
        .sort();

    const applied = new Set(
        db
            .prepare(`
                SELECT name
                FROM schema_migrations
            `)
            .all()
            .map(row => row.name)
    );

    for (const migration of migrations) {
        if (applied.has(migration)) {
            console.log(`Skipped: ${migration}`);
            continue;
        }

        const migrationFile = path.join(
            migrationsPath,
            migration
        );

        const sql = fs.readFileSync(
            migrationFile,
            "utf8"
        );

        try {
            db.exec("BEGIN");

            db.exec(sql);

            db.prepare(`
                INSERT INTO schema_migrations (name)
                VALUES (?)
            `).run(migration);

            db.exec("COMMIT");

            console.log(`Applied: ${migration}`);
        } catch (error) {
            try {
                db.exec("ROLLBACK");
            } catch {
                // Preserve the original migration error.
            }

            console.error(
                `Migration failed: ${migration}`
            );

            throw error;
        }
    }

    console.log("Migration process completed.");
}
