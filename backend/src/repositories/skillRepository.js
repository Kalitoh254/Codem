import db from "../database/db.js";

export function createSkill({
    id,
    name,
    slug,
    description = null
}) {
    db.prepare(`
        INSERT INTO skills (
            id,
            name,
            slug,
            description
        )
        VALUES (?, ?, ?, ?)
    `).run(
        id,
        name,
        slug,
        description
    );

    return findSkillById(id);
}

export function findSkillById(id) {
    return db
        .prepare(`
            SELECT
                id,
                name,
                slug,
                description,
                created_at
            FROM skills
            WHERE id = ?
        `)
        .get(id);
}

export function findSkillBySlug(slug) {
    return db
        .prepare(`
            SELECT
                id,
                name,
                slug,
                description,
                created_at
            FROM skills
            WHERE slug = ?
        `)
        .get(slug);
}

export function listSkills() {
    return db
        .prepare(`
            SELECT
                id,
                name,
                slug,
                description,
                created_at
            FROM skills
            ORDER BY name ASC
        `)
        .all();
}
