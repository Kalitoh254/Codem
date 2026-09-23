import crypto from "node:crypto";
import {
    listChallenges,
    countChallenges,
    findChallenge,
    createChallenge,
    updateChallenge,
    deleteChallenge
} from "../repositories/challengeRepository.js";

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
    return assertChallenge(id);
}

export function createNewChallenge(data) {
    const title = data.title?.trim();

    if (!title || title.length < 2 || title.length > 200) {
        throw Object.assign(
            new Error("Challenge title is invalid."),
            { status: 400, code: "INVALID_CHALLENGE_TITLE" }
        );
    }

    return createChallenge({
        id: crypto.randomUUID(),
        title,
        description: data.description?.trim() || "",
        difficulty: data.difficulty || "beginner"
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
