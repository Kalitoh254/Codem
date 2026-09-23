import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import {
    findUserByEmail,
    findUserById
} from "../repositories/userRepository.js";

import db from "../database/db.js";

import {
    createPasswordResetToken,
    findPasswordResetToken,
    markPasswordResetTokenUsed,
    revokeUserPasswordResetTokens,
    deleteExpiredPasswordResetTokens
} from "../repositories/passwordResetRepository.js";

function generateResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

function generateId() {
    return crypto.randomUUID();
}

function getExpiry() {
    return new Date(
        Date.now() + 15 * 60 * 1000
    ).toISOString();
}

function isExpired(expiresAt) {
    return new Date(expiresAt).getTime() <= Date.now();
}

function publicResetResult() {
    return {
        success: true,
        message: "If an account exists for that email, a password reset request has been created."
    };
}

export function requestPasswordReset(email) {
    if (!email || typeof email !== "string") {
        return publicResetResult();
    }

    const normalizedEmail = email
        .trim()
        .toLowerCase();

    const user = findUserByEmail(normalizedEmail);

    /*
     * Do not reveal whether an email exists.
     */
    if (!user) {
        return publicResetResult();
    }

    if (user.status !== "active") {
        return publicResetResult();
    }

    /*
     * Invalidate previously issued reset tokens
     * before creating a new one.
     */
    revokeUserPasswordResetTokens(user.id);

    deleteExpiredPasswordResetTokens();

    const token = generateResetToken();

    createPasswordResetToken({
        id: generateId(),
        userId: user.id,
        token,
        expiresAt: getExpiry()
    });

    /*
     * Development mode only.
     *
     * A production implementation should deliver this
     * token through a verified email provider rather than
     * returning it from the API.
     */
    if (process.env.NODE_ENV !== "production") {
        return {
            ...publicResetResult(),
            developmentToken: token
        };
    }

    return publicResetResult();
}

export function validatePasswordResetToken(token) {
    if (!token || typeof token !== "string") {
        const error = new Error("Invalid password reset token.");
        error.status = 400;
        error.code = "INVALID_RESET_TOKEN";
        throw error;
    }

    const resetToken = findPasswordResetToken(token);

    if (!resetToken) {
        const error = new Error("Invalid password reset token.");
        error.status = 400;
        error.code = "INVALID_RESET_TOKEN";
        throw error;
    }

    if (resetToken.used_at) {
        const error = new Error("Password reset token has already been used.");
        error.status = 400;
        error.code = "RESET_TOKEN_ALREADY_USED";
        throw error;
    }

    if (isExpired(resetToken.expires_at)) {
        const error = new Error("Password reset token has expired.");
        error.status = 400;
        error.code = "RESET_TOKEN_EXPIRED";
        throw error;
    }

    const user = findUserById(resetToken.user_id);

    if (!user || user.status !== "active") {
        const error = new Error("Invalid password reset token.");
        error.status = 400;
        error.code = "INVALID_RESET_TOKEN";
        throw error;
    }

    return {
        id: resetToken.id,
        userId: resetToken.user_id,
        expiresAt: resetToken.expires_at
    };
}

export function resetPassword(token, newPassword) {
    if (
        !newPassword ||
        typeof newPassword !== "string" ||
        newPassword.length < 8 ||
        newPassword.length > 128
    ) {
        const error = new Error(
            "Password must contain between 8 and 128 characters."
        );
        error.status = 400;
        error.code = "VALIDATION_ERROR";
        throw error;
    }

    const resetToken = validatePasswordResetToken(token);

    const passwordHash = bcrypt.hashSync(
        newPassword,
        12
    );

    /*
     * Update the password directly through the database.
     * This will be replaced with a dedicated user repository
     * method when password mutation operations are expanded.
     */
    db
        .prepare(`
            UPDATE users
            SET password_hash = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `)
        .run(
            passwordHash,
            resetToken.userId
        );

    markPasswordResetTokenUsed(token);

    /*
     * Invalidate every other outstanding reset token
     * belonging to this user.
     */
    revokeUserPasswordResetTokens(
        resetToken.userId
    );

    return {
        success: true,
        message: "Password has been reset successfully."
    };
}
