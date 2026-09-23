import db from "../database/db.js";

export function searchCommunityPosts({
    query = "",
    postType = null,
    status = null,
    tag = null,
    limit = 20,
    offset = 0
}) {
    const conditions = [];
    const params = [];

    if (query) {
        conditions.push(`
            (
                LOWER(p.title) LIKE LOWER(?)
                OR LOWER(p.content) LIKE LOWER(?)
            )
        `);

        const searchTerm = `%${query}%`;
        params.push(searchTerm, searchTerm);
    }

    if (postType) {
        conditions.push(`p.post_type = ?`);
        params.push(postType);
    }

    if (status) {
        conditions.push(`p.status = ?`);
        params.push(status);
    }

    if (tag) {
        conditions.push(`
            EXISTS (
                SELECT 1
                FROM post_tags pt
                INNER JOIN tags t
                    ON t.id = pt.tag_id
                WHERE pt.post_id = p.id
                AND LOWER(t.slug) = LOWER(?)
            )
        `);

        params.push(tag);
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    params.push(limit, offset);

    return db.prepare(`
        SELECT
            p.id,
            p.author_id,
            p.title,
            p.content,
            p.post_type,
            p.status,
            p.accepted_comment_id,
            p.view_count,
            p.created_at,
            p.updated_at,
            u.username,
            u.role
        FROM community_posts p
        INNER JOIN users u
            ON u.id = p.author_id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ?
        OFFSET ?
    `).all(...params);
}

export function countCommunityPosts({
    query = "",
    postType = null,
    status = null,
    tag = null
}) {
    const conditions = [];
    const params = [];

    if (query) {
        conditions.push(`
            (
                LOWER(p.title) LIKE LOWER(?)
                OR LOWER(p.content) LIKE LOWER(?)
            )
        `);

        const searchTerm = `%${query}%`;
        params.push(searchTerm, searchTerm);
    }

    if (postType) {
        conditions.push(`p.post_type = ?`);
        params.push(postType);
    }

    if (status) {
        conditions.push(`p.status = ?`);
        params.push(status);
    }

    if (tag) {
        conditions.push(`
            EXISTS (
                SELECT 1
                FROM post_tags pt
                INNER JOIN tags t
                    ON t.id = pt.tag_id
                WHERE pt.post_id = p.id
                AND LOWER(t.slug) = LOWER(?)
            )
        `);

        params.push(tag);
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    return db.prepare(`
        SELECT COUNT(*) AS count
        FROM community_posts p
        ${whereClause}
    `).get(...params).count;
}
