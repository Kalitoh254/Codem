import db from "../database/db.js";

export function createSubmission(data) {
    db.prepare(`
        INSERT INTO submissions (
            id,
            user_id,
            challenge_id,
            code,
            language,
            status,
            score,
            feedback,
            created_at
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
        )
    `).run(
        data.id,
        data.userId,
        data.challengeId,
        data.code,
        data.language,
        data.status,
        data.score,
        data.feedback
    );

    return findSubmission(data.id);
}

export function findSubmission(id) {
    return db.prepare(`
        SELECT
            s.id,
            s.user_id,
            s.challenge_id,
            s.code,
            s.language,
            s.status,
            s.score,
            s.feedback,
            s.created_at,
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
                s.created_at,
                c.title AS challenge_title
            FROM submissions s
            JOIN challenges c ON c.id = s.challenge_id
            WHERE s.user_id = ?
            AND s.challenge_id = ?
            ORDER BY s.created_at DESC
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
            s.created_at,
            c.title AS challenge_title
        FROM submissions s
        JOIN challenges c ON c.id = s.challenge_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    `).all(userId);
}
