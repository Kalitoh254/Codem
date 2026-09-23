import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import {
    createUser,
    findUserByEmail,
    findUserByUsername,
    findUserById,
    listUsers
} from "../repositories/userRepository.js";

import {
    createProfile
} from "../repositories/profileRepository.js";

function generateId() {
    return crypto.randomUUID();
}

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function normalizeUsername(username) {
    return username.trim().toLowerCase();
}

function validateRegistration({ email, username, password }) {
    if (!email || !username || !password) {
        const error = new Error(
            "Email, username, and password are required."
        );

        error.status = 400;
        error.code = "VALIDATION_ERROR";

        throw error;
    }

    if (!email.includes("@")) {
        const error = new Error(
            "A valid email address is required."
        );

        error.status = 400;
        error.code = "INVALID_EMAIL";

        throw error;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        const error = new Error(
            "Username must contain 3-30 letters, numbers, or underscores."
        );

        error.status = 400;
        error.code = "INVALID_USERNAME";

        throw error;
    }

    if (password.length < 8) {
        const error = new Error(
            "Password must contain at least 8 characters."
        );

        error.status = 400;
        error.code = "WEAK_PASSWORD";

        throw error;
    }
}

export async function registerUser({
    email,
    username,
    password,
    displayName = null
}) {
    validateRegistration({
        email,
        username,
        password
    });

    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);

    if (findUserByEmail(normalizedEmail)) {
        const error = new Error(
            "An account with this email already exists."
        );

        error.status = 409;
        error.code = "EMAIL_ALREADY_EXISTS";

        throw error;
    }

    if (findUserByUsername(normalizedUsername)) {
        const error = new Error(
            "This username is already taken."
        );

        error.status = 409;
        error.code = "USERNAME_ALREADY_EXISTS";

        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userId = generateId();

    createUser({
        id: userId,
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash
    });

    createProfile({
        id: generateId(),
        userId,
        displayName: displayName || normalizedUsername
    });

    return findUserById(userId);
}

export function getUserById(id) {
    const user = findUserById(id);

    if (!user) {
        const error = new Error("User not found.");

        error.status = 404;
        error.code = "USER_NOT_FOUND";

        throw error;
    }

    return user;
}

export function getUsers({ limit = 50, offset = 0 } = {}) {
    const safeLimit = Math.min(
        Math.max(Number(limit) || 50, 1),
        100
    );

    const safeOffset = Math.max(
        Number(offset) || 0,
        0
    );

    return listUsers(safeLimit, safeOffset);
}
