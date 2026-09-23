import crypto from "node:crypto";

import {
    findUserById
} from "../repositories/userRepository.js";

import {
    createEmailVerificationToken,
    findEmailVerificationToken,
    markEmailVerificationTokenUsed,
    revokeUserEmailVerificationTokens,
    deleteExpiredEmailVerificationTokens
} from "../repositories/emailVerificationRepository.js";

import db from "../database/db.js";

function generateVerificationToken() {
    return crypto.randomBytes(32).toString("hex");
}

function generateId() {
    return crypto.randomUUID();
}

function getExpiry() {
    return new Date(
        Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();
}

function isExpired(expiresAt) {
    return new Date(expiresAt).getTime() <= Date.now();
}

export function requestEmailVerification(userId) {
    const user = findUserById(userId);

    if (!user) {
        const error = new Error("User not found.");
        error.status = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
    }

    if (user.status !== "active") {
        const error = new Error("User account is not active.");
        error.status = 403;
        error.code = "ACCOUNT_NOT_ACTIVE";
        throw error;
    }

    if (Boolean(user.email_verified)) {
        return {
            success: true,
            message: "Email address is already verified."
        };
    }

    revokeUserEmailVerificationTokens(user.id);
    deleteExpiredEmailVerificationTokens();

    const token = generateVerificationToken();

    createEmailVerificationToken({
        id: generateId(),
        userId: user.id,
        token,
        expiresAt: getExpiry()
    });

    /*
     * Development mode only.
     *
     * Production will deliver this token through
     * a verified email provider.
     */
    if (process.env.NODE_ENV !== "production") {
        return {
            success: true,
            message: "Email verification request created.",
            developmentToken: token
        };
    }

    return {
        success: true,
        message: "Email verification request created."
    };
}

export function validateEmailVerificationToken(token) {
    if (!token || typeof token !== "string") {
        const error = new Error("Invalid email verification token.");
        error.status = 400;
        error.code = "INVALID_VERIFICATION_TOKEN";
        throw error;
    }

    const verificationToken =
        findEmailVerificationToken(token);

    if (!verificationToken) {
        const error = new Error("Invalid email verification token.");
        error.status = 400;
        error.code = "INVALID_VERIFICATION_TOKEN";
        throw error;
    }

    if (verificationToken.used_at) {
        const error = new Error(
            "Email verification token has already been used."
        );
        error.status = 400;
        error.code = "VERIFICATION_TOKEN_ALREADY_USED";
        throw error;
    }

    if (isExpired(verificationToken.expires_at)) {
        const error = new Error(
            "Email verification token has expired."
        );
        error.status = 400;
        error.code = "VERIFICATION_TOKEN_EXPIRED";
        throw error;
    }

    const user = findUserById(
        verificationToken.user_id
    );

    if (!user || user.status !== "active") {
        const error = new Error(
            "Invalid email verification token."
        );
        error.status = 400;
        error.code = "INVALID_VERIFICATION_TOKEN";
        throw error;
    }

    return {
        id: verificationToken.id,
        userId: verificationToken.user_id,
        expiresAt: verificationToken.expires_at
    };
}

export function verifyEmail(token) {
    const verificationToken =
        validateEmailVerificationToken(token);

    db.prepare(`
        UPDATE users
        SET email_verified = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        verificationToken.userId
    );

    markEmailVerificationTokenUsed(token);

    revokeUserEmailVerificationTokens(
        verificationToken.userId
    );

    return {
        success: true,
        message: "Email address verified successfully."
    };
}
