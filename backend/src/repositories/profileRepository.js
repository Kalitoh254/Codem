import db from "../database/db.js";

export function createProfile({
    id,
    userId,
    displayName = null,
    bio = null
}) {
    db.prepare(`
        INSERT INTO profiles (
            id,
            user_id,
            display_name,
            bio
        )
        VALUES (?, ?, ?, ?)
    `).run(
        id,
        userId,
        displayName,
        bio
    );

    return findProfileByUserId(userId);
}

export function findProfileByUserId(userId) {
    return db
        .prepare(`
            SELECT
                id,
                user_id,
                display_name,
                bio,
                avatar_url,
                location,
                website_url,
                github_url,
                linkedin_url,
                created_at,
                updated_at
            FROM profiles
            WHERE user_id = ?
        `)
        .get(userId);
}

export function updateProfile(userId, fields) {
    const allowedFields = [
        "display_name",
        "bio",
        "avatar_url",
        "location",
        "website_url",
        "github_url",
        "linkedin_url"
    ];

    const updates = Object.entries(fields)
        .filter(([key]) => allowedFields.includes(key));

    if (updates.length === 0) {
        return findProfileByUserId(userId);
    }

    const setClause = updates
        .map(([key]) => `${key} = ?`)
        .join(", ");

    const values = updates.map(([, value]) => value);

    values.push(userId);

    db.prepare(`
        UPDATE profiles
        SET ${setClause},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
    `).run(...values);

    return findProfileByUserId(userId);
}
