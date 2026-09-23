import db from "../database/db.js";

export function listChallenges({ limit, offset, difficulty }) {
    const conditions = [];
    const params = [];

    if (difficulty) {
        conditions.push("difficulty = ?");
        params.push(difficulty);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    return db.prepare(`
        SELECT *
        FROM challenges
        ${where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
}

export function countChallenges({ difficulty }) {
    const conditions = [];
    const params = [];

    if (difficulty) {
        conditions.push("difficulty = ?");
        params.push(difficulty);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    return db.prepare(`
        SELECT COUNT(*) AS total
        FROM challenges
        ${where}
    `).get(...params).total;
}

export function findChallenge(id) {
    return db.prepare(`
        SELECT *
        FROM challenges
        WHERE id = ?
    `).get(id);
}

export function createChallenge(data) {
    db.prepare(`
        INSERT INTO challenges (
            id,
            title,
            description,
            difficulty,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
        data.id,
        data.title,
        data.description,
        data.difficulty
    );

    return findChallenge(data.id);
}

export function updateChallenge(id, data) {
    const fields = [];
    const params = [];

    for (const field of [
        "title",
        "description",
        "difficulty"
    ]) {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            params.push(data[field]);
        }
    }

    if (!fields.length) return findChallenge(id);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    db.prepare(`
        UPDATE challenges
        SET ${fields.join(", ")}
        WHERE id = ?
    `).run(...params);

    return findChallenge(id);
}

export function deleteChallenge(id) {
    return db.prepare(
        "DELETE FROM challenges WHERE id = ?"
    ).run(id);
}
