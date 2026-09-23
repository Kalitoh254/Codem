import db from "../database/db.js";

function findUser(userId) {
    return db.prepare(`
        SELECT id
        FROM users
        WHERE id = ?
    `).get(userId);
}

function findSkill(skillId) {
    return db.prepare(`
        SELECT *
        FROM skills
        WHERE id = ?
    `).get(skillId);
}

function findUserSkill(userId, skillId) {
    return db.prepare(`
        SELECT
            us.user_id,
            us.skill_id,
            us.proficiency AS level,
            s.name,
            s.slug
        FROM user_skills us
        INNER JOIN skills s
            ON s.id = us.skill_id
        WHERE us.user_id = ?
        AND us.skill_id = ?
    `).get(userId, skillId);
}

export function addDeveloperSkill(
    userId,
    skillId,
    level = "beginner"
) {
    if (!findUser(userId)) {
        const error = new Error("User not found.");
        error.status = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
    }

    const skill = findSkill(skillId);

    if (!skill) {
        const error = new Error("Skill not found.");
        error.status = 404;
        error.code = "SKILL_NOT_FOUND";
        throw error;
    }

    const allowedLevels = [
        "beginner",
        "intermediate",
        "advanced",
        "expert"
    ];

    if (!allowedLevels.includes(level)) {
        const error = new Error("Invalid skill level.");
        error.status = 400;
        error.code = "INVALID_SKILL_LEVEL";
        throw error;
    }

    if (findUserSkill(userId, skillId)) {
        const error = new Error(
            "Developer already has this skill."
        );
        error.status = 409;
        error.code = "USER_SKILL_ALREADY_EXISTS";
        throw error;
    }

    db.prepare(`
        INSERT INTO user_skills (
            user_id,
            skill_id,
            proficiency
        )
        VALUES (?, ?, ?)
    `).run(
        userId,
        skillId,
        level
    );

    return findUserSkill(userId, skillId);
}

export function updateDeveloperSkill(
    userId,
    skillId,
    level
) {
    const existing = findUserSkill(userId, skillId);

    if (!existing) {
        const error = new Error(
            "Developer skill not found."
        );
        error.status = 404;
        error.code = "USER_SKILL_NOT_FOUND";
        throw error;
    }

    const allowedLevels = [
        "beginner",
        "intermediate",
        "advanced",
        "expert"
    ];

    if (!allowedLevels.includes(level)) {
        const error = new Error("Invalid skill level.");
        error.status = 400;
        error.code = "INVALID_SKILL_LEVEL";
        throw error;
    }

    db.prepare(`
        UPDATE user_skills
        SET proficiency = ?
        WHERE user_id = ?
        AND skill_id = ?
    `).run(
        level,
        userId,
        skillId
    );

    return findUserSkill(userId, skillId);
}

export function removeDeveloperSkill(
    userId,
    skillId
) {
    const existing = findUserSkill(userId, skillId);

    if (!existing) {
        const error = new Error(
            "Developer skill not found."
        );
        error.status = 404;
        error.code = "USER_SKILL_NOT_FOUND";
        throw error;
    }

    db.prepare(`
        DELETE FROM user_skills
        WHERE user_id = ?
        AND skill_id = ?
    `).run(
        userId,
        skillId
    );

    return {
        message: "Developer skill removed successfully."
    };
}

export function getDeveloperSkills(userId) {
    if (!findUser(userId)) {
        const error = new Error("User not found.");
        error.status = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
    }

    return db.prepare(`
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
}
