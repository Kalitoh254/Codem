import db from "../database/db.js";

export function createCourse(data) {
    db.prepare(`
        INSERT INTO courses (
            id, title, slug, description,
            difficulty, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
        data.id,
        data.title,
        data.slug,
        data.description,
        data.difficulty,
        data.status
    );

    return findCourseById(data.id);
}

export function findCourseById(id) {
    return db.prepare(`
        SELECT *
        FROM courses
        WHERE id = ?
    `).get(id);
}

export function findCourseBySlug(slug) {
    return db.prepare(`
        SELECT *
        FROM courses
        WHERE slug = ?
    `).get(slug);
}

export function listCourses({ limit, offset, difficulty, status }) {
    const conditions = [];
    const params = [];

    if (difficulty) {
        conditions.push("difficulty = ?");
        params.push(difficulty);
    }

    if (status) {
        conditions.push("status = ?");
        params.push(status);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    return db.prepare(`
        SELECT *
        FROM courses
        ${where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
}

export function countCourses({ difficulty, status }) {
    const conditions = [];
    const params = [];

    if (difficulty) {
        conditions.push("difficulty = ?");
        params.push(difficulty);
    }

    if (status) {
        conditions.push("status = ?");
        params.push(status);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    return db.prepare(`
        SELECT COUNT(*) AS total
        FROM courses
        ${where}
    `).get(...params).total;
}

export function updateCourse(id, data) {
    const fields = [];
    const params = [];

    for (const field of [
        "title",
        "slug",
        "description",
        "difficulty",
        "status"
    ]) {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            params.push(data[field]);
        }
    }

    if (!fields.length) return findCourseById(id);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    db.prepare(`
        UPDATE courses
        SET ${fields.join(", ")}
        WHERE id = ?
    `).run(...params);

    return findCourseById(id);
}

export function deleteCourse(id) {
    return db.prepare(
        "DELETE FROM courses WHERE id = ?"
    ).run(id);
}
