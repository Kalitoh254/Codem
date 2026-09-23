import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.resolve(
    __dirname,
    "../../../database/schema.sql"
);

const schema = fs.readFileSync(schemaPath, "utf8");

db.exec(schema);

const result = db
    .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
    `)
    .all();

console.log("Codem database initialized successfully.");
console.log(`Tables: ${result.length}`);

for (const table of result) {
    console.log(`- ${table.name}`);
}

db.close();
