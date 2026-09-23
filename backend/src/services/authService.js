import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import {
    findUserByEmail
} from "../repositories/userRepository.js";

import {
    registerUser
} from "./userService.js";

import {
    createSession,
    findSessionByToken,
    revokeSessionByToken,
    revokeAllUserSessions
} from "../repositories/sessionRepository.js";

function generateToken() {
    return crypto.randomBytes(32).toString("hex");
}

function generateSessionId() {
    return crypto.randomUUID();
}

function createExpiryDate() {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 30);

    return expiresAt.toISOString();
}

function publicUser(user) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        email_verified: Boolean(user.email_verified),
        created_at: user.created_at,
        updated_at: user.updated_at
    };
}

export async function register({
    email,
    username,
    password,
    displayName
}) {
    const user = await registerUser({
        email,
        username,
        password,
        displayName
    });

    const token = generateToken();

    createSession({
        id: generateSessionId(),
        userId: user.id,
        token,
        expiresAt: createExpiryDate()
    });

    return {
        user: publicUser(user),
        token
    };
}

export async function login({
    email,
    password
}) {
    if (!email || !password) {
        const error = new Error(
            "Email and password are required."
        );

        error.status = 400;
        error.code = "VALIDATION_ERROR";

        throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = findUserByEmail(normalizedEmail);

    if (!user) {
        const error = new Error(
            "Invalid email or password."
        );

        error.status = 401;
        error.code = "INVALID_CREDENTIALS";

        throw error;
    }

    if (user.status !== "active") {
        const error = new Error(
            "This account is not active."
        );

        error.status = 403;
        error.code = "ACCOUNT_INACTIVE";

        throw error;
    }

    const passwordValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordValid) {
        const error = new Error(
            "Invalid email or password."
        );

        error.status = 401;
        error.code = "INVALID_CREDENTIALS";

        throw error;
    }

    const token = generateToken();

    createSession({
        id: generateSessionId(),
        userId: user.id,
        token,
        expiresAt: createExpiryDate()
    });

    return {
        user: publicUser(user),
        token
    };
}

export function authenticateToken(token) {
    if (!token) {
        const error = new Error(
            "Authentication token is required."
        );

        error.status = 401;
        error.code = "AUTHENTICATION_REQUIRED";

        throw error;
    }

    const session = findSessionByToken(token);

    if (!session) {
        const error = new Error(
            "Invalid authentication token."
        );

        error.status = 401;
        error.code = "INVALID_TOKEN";

        throw error;
    }

    if (session.revoked_at) {
        const error = new Error(
            "This session has been revoked."
        );

        error.status = 401;
        error.code = "SESSION_REVOKED";

        throw error;
    }

    if (
        new Date(session.expires_at).getTime() <=
        Date.now()
    ) {
        const error = new Error(
            "This session has expired."
        );

        error.status = 401;
        error.code = "SESSION_EXPIRED";

        throw error;
    }

    if (session.status !== "active") {
        const error = new Error(
            "This account is not active."
        );

        error.status = 403;
        error.code = "ACCOUNT_INACTIVE";

        throw error;
    }

    return {
        id: session.user_id,
        email: session.email,
        username: session.username,
        role: session.role,
        status: session.status,
        email_verified: Boolean(session.email_verified)
    };
}

export function logout(token) {
    if (!token) {
        const error = new Error(
            "Authentication token is required."
        );

        error.status = 401;
        error.code = "AUTHENTICATION_REQUIRED";

        throw error;
    }

    revokeSessionByToken(token);

    return {
        loggedOut: true
    };
}

export function logoutAll(userId) {
    revokeAllUserSessions(userId);

    return {
        loggedOut: true
    };
}
