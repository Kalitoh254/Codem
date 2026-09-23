import crypto from "node:crypto";

import {
    createSkill,
    findSkillById,
    findSkillBySlug,
    listSkills
} from "../repositories/skillRepository.js";

function generateId() {
    return crypto.randomUUID();
}

function normalizeSlug(slug) {
    return slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function createNewSkill({
    name,
    slug,
    description = null
}) {
    if (!name || !name.trim()) {
        const error = new Error("Skill name is required.");

        error.status = 400;
        error.code = "VALIDATION_ERROR";

        throw error;
    }

    const normalizedSlug = normalizeSlug(slug || name);

    if (!normalizedSlug) {
        const error = new Error("A valid skill slug is required.");

        error.status = 400;
        error.code = "INVALID_SKILL_SLUG";

        throw error;
    }

    if (findSkillBySlug(normalizedSlug)) {
        const error = new Error(
            "A skill with this slug already exists."
        );

        error.status = 409;
        error.code = "SKILL_ALREADY_EXISTS";

        throw error;
    }

    return createSkill({
        id: generateId(),
        name: name.trim(),
        slug: normalizedSlug,
        description
    });
}

export function getSkillById(id) {
    const skill = findSkillById(id);

    if (!skill) {
        const error = new Error("Skill not found.");

        error.status = 404;
        error.code = "SKILL_NOT_FOUND";

        throw error;
    }

    return skill;
}

export function getSkills() {
    return listSkills();
}
