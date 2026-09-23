import db from "../database/db.js";

export function createTag({
    id,
    name,
    slug
}) {
    db.prepare(`
        INSERT INTO tags (
            id,
            name,
            slug
        )
        VALUES (?, ?, ?)
    `).run(
        id,
        name,
        slug
    );

    return findTagById(id);
}

export function findTagById(id) {
    return db.prepare(`
        SELECT *
        FROM tags
        WHERE id = ?
    `).get(id);
}

export function findTagBySlug(slug) {
    return db.prepare(`
        SELECT *
        FROM tags
        WHERE slug = ?
    `).get(slug);
}

export function listTags() {
    return db.prepare(`
        SELECT *
        FROM tags
        ORDER BY name ASC
    `).all();
}

export function addTagToPost({
    postId,
    tagId
}) {
    db.prepare(`
        INSERT INTO post_tags (
            post_id,
            tag_id
        )
        VALUES (?, ?)
    `).run(
        postId,
        tagId
    );
}

export function removeTagFromPost({
    postId,
    tagId
}) {
    db.prepare(`
        DELETE FROM post_tags
        WHERE post_id = ?
        AND tag_id = ?
    `).run(
        postId,
        tagId
    );
}

export function listPostTags(postId) {
    return db.prepare(`
        SELECT
            t.id,
            t.name,
            t.slug
        FROM tags t
        INNER JOIN post_tags pt
            ON pt.tag_id = t.id
        WHERE pt.post_id = ?
        ORDER BY t.name ASC
    `).all(postId);
}

export function findTagByName(name) {
    return db.prepare(`
        SELECT *
        FROM tags
        WHERE LOWER(name) = LOWER(?)
    `).get(name);
}
