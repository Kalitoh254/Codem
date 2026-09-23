import crypto from "node:crypto";
import {
    listChallenges,
    countChallenges,
    findChallenge,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    findPublishedChallenge
} from "../repositories/challengeRepository.js";

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);
}

function assertChallenge(id) {
    const challenge = findChallenge(id);

    if (!challenge) {
        throw Object.assign(
            new Error("Challenge not found."),
            { status: 404, code: "CHALLENGE_NOT_FOUND" }
        );
    }

    return challenge;
}

export function getChallenges(options = {}) {
    const page = Math.max(Number.parseInt(options.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(Number.parseInt(options.limit, 10) || 20, 1),
        50
    );

    const filters = {
        difficulty: options.difficulty
    };

    const total = countChallenges(filters);

    return {
        challenges: listChallenges({
            ...filters,
            limit,
            offset: (page - 1) * limit
        }),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export function getChallenge(id) {
    const challenge = findPublishedChallenge(id);

    if (!challenge) {
        throw Object.assign(
            new Error("Challenge not found."),
            { status: 404, code: "CHALLENGE_NOT_FOUND" }
        );
    }

    return challenge;
}

export function createNewChallenge(data, createdBy) {
    const title = data.title?.trim();

    if (!title || title.length < 2 || title.length > 200) {
        throw Object.assign(
            new Error("Challenge title is invalid."),
            { status: 400, code: "INVALID_CHALLENGE_TITLE" }
        );
    }

    const slug = slugify(data.slug || title);

    if (!slug) {
        throw Object.assign(
            new Error("A valid challenge slug is required."),
            { status: 400, code: "INVALID_CHALLENGE_SLUG" }
        );
    }

    return createChallenge({
        id: crypto.randomUUID(),
        title,
        slug,
        description: data.description?.trim() || "",
        difficulty: data.difficulty || "beginner",
        language: data.language || null,
        instructions: data.instructions?.trim() || null,
        starterCode: data.starterCode || null,
        solutionCode: data.solutionCode || null,
        testCases: data.testCases || null,
        createdBy,
        status: data.status || "draft"
    });
}

export function editChallenge(id, data) {
    assertChallenge(id);

    return updateChallenge(id, {
        ...(data.title !== undefined
            ? { title: data.title.trim() }
            : {}),
        ...(data.description !== undefined
            ? { description: data.description }
            : {}),
        ...(data.difficulty !== undefined
            ? { difficulty: data.difficulty }
            : {})
    });
}

export function removeChallenge(id) {
    assertChallenge(id);
    deleteChallenge(id);
    return { deleted: true };
}
