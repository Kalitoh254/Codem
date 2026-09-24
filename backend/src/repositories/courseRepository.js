import db from "../database/db.js";

export function createCourse(data) {
    db.prepare(`
        INSERT INTO courses (
            id,
            title,
            slug,
            description,
            thumbnail_url,
            difficulty,
            status,
            category,
            duration_minutes,
            prerequisites,
            learning_outcomes,
            created_by,
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
        data.description ?? "",
        data.thumbnailUrl ?? null,
        data.difficulty ?? "beginner",
        data.status ?? "draft",
        data.category ?? null,
        data.durationMinutes ?? null,
        data.prerequisites ?? null,
        data.learningOutcomes ?? null,
        data.createdBy ?? null
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

export function listCourses({
    limit,
    offset,
    difficulty,
    status,
    category
}) {
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

    if (category) {
        conditions.push("category = ?");
        params.push(category);
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

export function countCourses({
    difficulty,
    status,
    category
}) {
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

    if (category) {
        conditions.push("category = ?");
        params.push(category);
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

    const fieldMap = {
        title: "title",
        slug: "slug",
        description: "description",
        thumbnailUrl: "thumbnail_url",
        difficulty: "difficulty",
        status: "status",
        category: "category",
        durationMinutes: "duration_minutes",
        prerequisites: "prerequisites",
        learningOutcomes: "learning_outcomes",
        createdBy: "created_by"
    };

    for (const [key, column] of Object.entries(fieldMap)) {
        if (data[key] !== undefined) {
            fields.push(`${column} = ?`);
            params.push(data[key]);
        }
    }

    if (!fields.length) {
        return findCourseById(id);
    }

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
    return db.prepare(`
        DELETE FROM courses
        WHERE id = ?
    `).run(id);
}

export function findCourseCurriculum(id) {
    return db.prepare(`
        SELECT
            c.id AS course_id,
            c.title AS course_title,
            c.slug AS course_slug,
            c.description AS course_description,
            c.thumbnail_url AS course_thumbnail_url,
            c.difficulty AS course_difficulty,
            c.status AS course_status,
            c.category AS course_category,
            c.duration_minutes AS course_duration_minutes,
            c.prerequisites AS course_prerequisites,
            c.learning_outcomes AS course_learning_outcomes,

            m.id AS module_id,
            m.title AS module_title,
            m.slug AS module_slug,
            m.description AS module_description,
            m.position AS module_position,
            m.status AS module_status,

            l.id AS lesson_id,
            l.title AS lesson_title,
            l.slug AS lesson_slug,
            l.description AS lesson_description,
            l.position AS lesson_position,
            l.lesson_type,
            l.is_required,
            l.estimated_minutes

        FROM courses c

        LEFT JOIN course_modules m
            ON m.course_id = c.id

        LEFT JOIN lessons l
            ON l.module_id = m.id

        WHERE c.id = ?

        ORDER BY
            m.position ASC,
            m.created_at ASC,
            l.position ASC,
            l.created_at ASC
    `).all(id);
}
