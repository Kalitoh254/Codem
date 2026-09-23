import db from "../database/db.js";

function findUser(userId) {
    return db.prepare(`
        SELECT
            id,
            email,
            username,
            role,
            status,
            email_verified,
            created_at,
            updated_at
        FROM users
        WHERE id = ?
    `).get(userId);
}

function findProfile(userId) {
    return db.prepare(`
        SELECT *
        FROM profiles
        WHERE user_id = ?
    `).get(userId);
}

export function getDeveloperProfile(userId) {
    const user = findUser(userId);

    if (!user) {
        const error = new Error("User not found.");
        error.status = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
    }

    const profile = findProfile(userId);

    if (!profile) {
        const error = new Error("Developer profile not found.");
        error.status = 404;
        error.code = "PROFILE_NOT_FOUND";
        throw error;
    }

    const skills = db.prepare(`
        SELECT
            s.id,
            s.name,
            s.slug,
            us.proficiency AS level
        FROM user_skills us
        INNER JOIN skills s
            ON s.id = us.skill_id
        WHERE us.user_id = ?
        ORDER BY s.name ASC
    `).all(userId);

    return {
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            status: user.status,
            email_verified: Boolean(user.email_verified),
            created_at: user.created_at
        },
        profile,
        skills
    };
}

export function updateDeveloperProfile(userId, data) {
    const profile = findProfile(userId);

    if (!profile) {
        const error = new Error("Developer profile not found.");
        error.status = 404;
        error.code = "PROFILE_NOT_FOUND";
        throw error;
    }

    const allowedFields = [
        "display_name",
        "bio",
        "avatar_url",
        "location",
        "website_url",
        "github_url",
        "linkedin_url",
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(data[field]);
        }
    }

    if (updates.length === 0) {
        return findProfile(userId);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(userId);

    db.prepare(`
        UPDATE profiles
        SET ${updates.join(", ")}
        WHERE user_id = ?
    `).run(...values);

    return findProfile(userId);
}
