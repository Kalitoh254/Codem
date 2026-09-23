import db from "../database/db.js";

export function createSubmission(data) {
    db.prepare(`
        INSERT INTO submissions (
            id,
            user_id,
            challenge_id,
            language,
            source_code,
            status,
            score,
            feedback,
            execution_time_ms,
            memory_used,
            submitted_at
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
        )
    `).run(
        data.id,
        data.userId,
        data.challengeId,
        data.language,
        data.sourceCode,
        data.status,
        data.score ?? null,
        data.feedback ?? null,
        data.executionTimeMs ?? null,
        data.memoryUsed ?? null
    );

    return findSubmission(data.id);
}

export function findSubmission(id) {
    return db.prepare(`
        SELECT
            s.id,
            s.user_id,
            s.challenge_id,
            s.language,
            s.source_code,
            s.status,
            s.score,
            s.feedback,
            s.execution_time_ms,
            s.memory_used,
            s.submitted_at,
            c.title AS challenge_title
        FROM submissions s
        JOIN challenges c ON c.id = s.challenge_id
        WHERE s.id = ?
    `).get(id);
}

export function listUserSubmissions(userId, challengeId) {
    if (challengeId) {
        return db.prepare(`
            SELECT
                s.id,
                s.challenge_id,
                s.language,
                s.status,
                s.score,
                s.feedback,
                s.execution_time_ms,
                s.memory_used,
                s.submitted_at,
                c.title AS challenge_title
            FROM submissions s
            JOIN challenges c ON c.id = s.challenge_id
            WHERE s.user_id = ?
            AND s.challenge_id = ?
            ORDER BY s.submitted_at DESC
        `).all(userId, challengeId);
    }

    return db.prepare(`
        SELECT
            s.id,
            s.challenge_id,
            s.language,
            s.status,
            s.score,
            s.feedback,
            s.execution_time_ms,
            s.memory_used,
            s.submitted_at,
            c.title AS challenge_title
        FROM submissions s
        JOIN challenges c ON c.id = s.challenge_id
        WHERE s.user_id = ?
        ORDER BY s.submitted_at DESC
    `).all(userId);
}
