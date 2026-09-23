import db from "../database/db.js";

export function listLessons(courseId) {
    return db.prepare(`
        SELECT *
        FROM lessons
        WHERE course_id = ?
        ORDER BY position ASC, created_at ASC
    `).all(courseId);
}

export function findLessonById(id) {
    return db.prepare(`
        SELECT *
        FROM lessons
        WHERE id = ?
    `).get(id);
}

export function createLesson(data) {
    db.prepare(`
        INSERT INTO lessons (
            id, course_id, title, content,
            position, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
        data.id,
        data.courseId,
        data.title,
        data.content,
        data.position
    );

    return findLessonById(data.id);
}

export function updateLesson(id, data) {
    const fields = [];
    const params = [];

    for (const field of ["title", "content", "position"]) {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            params.push(data[field]);
        }
    }

    if (!fields.length) return findLessonById(id);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    db.prepare(`
        UPDATE lessons
        SET ${fields.join(", ")}
        WHERE id = ?
    `).run(...params);

    return findLessonById(id);
}

export function deleteLesson(id) {
    return db.prepare(
        "DELETE FROM lessons WHERE id = ?"
    ).run(id);
}
