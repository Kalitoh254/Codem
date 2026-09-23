import crypto from "node:crypto";
import db from "../database/db.js";
import {
    createSubmission,
    findSubmission,
    listUserSubmissions
} from "../repositories/submissionRepository.js";
import { evaluateSubmission } from "./evaluationService.js";

function assertChallenge(id) {
    const challenge = db.prepare(
        "SELECT id FROM challenges WHERE id = ?"
    ).get(id);

    if (!challenge) {
        throw Object.assign(
            new Error("Challenge not found."),
            { status: 404, code: "CHALLENGE_NOT_FOUND" }
        );
    }
}

export function submitChallenge(userId, challengeId, data) {
    assertChallenge(challengeId);

    if (
        typeof data.code !== "string" ||
        !data.code.trim() ||
        data.code.length > 500_000
    ) {
        throw Object.assign(
            new Error("Submission code is invalid or too large."),
            { status: 400, code: "INVALID_SUBMISSION" }
        );
    }

    if (
        typeof data.language !== "string" ||
        data.language.length > 30
    ) {
        throw Object.assign(
            new Error("Submission language is invalid."),
            { status: 400, code: "INVALID_LANGUAGE" }
        );
    }

    const evaluation = evaluateSubmission({
        language: data.language
    });

    const databaseStatus =
        evaluation.status === "pending"
            ? "queued"
            : evaluation.status === "unsupported"
                ? "error"
                : evaluation.status;

    return createSubmission({
        id: crypto.randomUUID(),
        userId,
        challengeId,
        sourceCode: data.code,
        language: data.language,
        status: databaseStatus,
        score: evaluation.score,
        feedback: evaluation.feedback,
        executionTimeMs: null,
        memoryUsed: null
    });
}

export function getSubmission(userId, id) {
    const submission = findSubmission(id);

    if (!submission) {
        throw Object.assign(
            new Error("Submission not found."),
            { status: 404, code: "SUBMISSION_NOT_FOUND" }
        );
    }

    if (
        submission.user_id !== userId
    ) {
        throw Object.assign(
            new Error("Submission access denied."),
            { status: 403, code: "SUBMISSION_ACCESS_DENIED" }
        );
    }

    return submission;
}

export function getMySubmissions(userId, challengeId) {
    return listUserSubmissions(userId, challengeId);
}
