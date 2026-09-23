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
            slug,
            description,
            difficulty,
            language,
            instructions,
            starter_code,
            solution_code,
            test_cases,
            created_by,
            status,
            created_at,
            updated_at
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
    `).run(
        data.id,
        data.title,
        data.slug,
        data.description,
        data.difficulty,
        data.language ?? null,
        data.instructions ?? null,
        data.starterCode ?? null,
        data.solutionCode ?? null,
        data.testCases ?? null,
        data.createdBy ?? null,
        data.status ?? "draft"
    );

    return findChallenge(data.id);
}

export function updateChallenge(id, data) {
    const fields = [];
    const params = [];

    const fieldMap = {
        title: "title",
        slug: "slug",
        description: "description",
        difficulty: "difficulty",
        language: "language",
        instructions: "instructions",
        starterCode: "starter_code",
        solutionCode: "solution_code",
        testCases: "test_cases",
        status: "status"
    };

    for (const [input, column] of Object.entries(fieldMap)) {
        if (data[input] !== undefined) {
            fields.push(`${column} = ?`);
            params.push(data[input]);
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
