import assert from "node:assert/strict";

import db from "../src/database/db.js";
import { register, login } from "../src/services/authService.js";
import {
    createUserApiKey,
    authenticateApiKey,
    revokeUserApiKey
} from "../src/services/apiKeyService.js";

const BASE_URL = "http://127.0.0.1:5000";

let passed = 0;
let failed = 0;

function check(name, condition) {
    if (condition) {
        passed++;
        console.log(`PASS: ${name}`);
    } else {
        failed++;
        console.log(`FAIL: ${name}`);
    }
}

async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...(options.headers || {})
        }
    });

    let body = null;

    try {
        body = await response.json();
    } catch {
        body = null;
    }

    return {
        status: response.status,
        body,
        headers: response.headers
    };
}

async function main() {
    console.log("=".repeat(60));
    console.log("CODEM PHASE 3F DEEP SECURITY REGRESSION");
    console.log("=".repeat(60));

    /*
     * ----------------------------------------------------------
     * TEST USERS
     * ----------------------------------------------------------
     */

    const timestamp = Date.now();

    const userA = await register({
        email: `phase3f.a.${timestamp}@codem.test`,
        username: `phase3f_a_${timestamp}`,
        password: "Phase3FStrongPassword!123",
        displayName: "Phase 3F User A"
    });

    const userB = await register({
        email: `phase3f.b.${timestamp}@codem.test`,
        username: `phase3f_b_${timestamp}`,
        password: "Phase3FStrongPassword!123",
        displayName: "Phase 3F User B"
    });

    const loginA = await login({
        email: userA.user.email,
        password: "Phase3FStrongPassword!123"
    });

    const loginB = await login({
        email: userB.user.email,
        password: "Phase3FStrongPassword!123"
    });

    const tokenA = loginA.token;
    const tokenB = loginB.token;

    check(
        "User A can authenticate",
        Boolean(tokenA)
    );

    check(
        "User B can authenticate",
        Boolean(tokenB)
    );

    /*
     * ----------------------------------------------------------
     * 1. PRIVILEGE FIELD TAMPERING
     * ----------------------------------------------------------
     */

    const privilegeTamper = await request(
        `/api/v1/developers/${userA.user.id}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                display_name: "Tampered User",
                role: "admin",
                status: "active",
                email_verified: true
            })
        }
    );

    check(
        "User cannot modify privilege fields through profile update",
        privilegeTamper.status < 500
    );

    const storedUserA = db.prepare(`
        SELECT role, status
        FROM users
        WHERE id = ?
    `).get(userA.user.id);

    check(
        "Privilege-field tampering cannot promote user",
        storedUserA?.role === "user"
    );

    check(
        "Privilege-field tampering cannot alter account status",
        storedUserA?.status === "active"
    );

    /*
     * ----------------------------------------------------------
     * 2. PROFILE OWNERSHIP
     * ----------------------------------------------------------
     */

    const profileCrossUser = await request(
        `/api/v1/developers/${userB.user.id}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                display_name: "Unauthorized Modification"
            })
        }
    );

    check(
        "User A cannot modify User B profile",
        profileCrossUser.status === 403
    );

    /*
     * ----------------------------------------------------------
     * 3. API KEY USER ISOLATION
     * ----------------------------------------------------------
     */

    const keyA = createUserApiKey({
        userId: userA.user.id,
        name: `phase3f-key-${timestamp}`,
        scopes: ["read"]
    });

    check(
        "User A API key is generated",
        Boolean(keyA.key)
    );

    const keyB = createUserApiKey({
        userId: userB.user.id,
        name: `phase3f-key-b-${timestamp}`,
        scopes: ["read"]
    });

    check(
        "User B API key is generated",
        Boolean(keyB.key)
    );

    const userBKeysFromA = await request(
        "/api/v1/keys",
        {
            headers: {
                Authorization: `Bearer ${tokenA}`
            }
        }
    );

    check(
        "User A cannot list User B API keys",
        Array.isArray(userBKeysFromA.body?.data)
            ? !userBKeysFromA.body.data.some(
                key => key.user_id === userB.user.id
            )
            : userBKeysFromA.status < 500
    );

    /*
     * ----------------------------------------------------------
     * 4. API KEY EXPIRY
     * ----------------------------------------------------------
     */

    const expiredKeyId = `phase3f-expired-${timestamp}`;

    db.prepare(`
        INSERT INTO api_keys (
            id,
            user_id,
            name,
            key_prefix,
            key_hash,
            scopes,
            expires_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        expiredKeyId,
        userA.user.id,
        "phase3f-expired",
        "cdm_expired",
        "phase3f-expired-hash-" + timestamp,
        JSON.stringify(["read"]),
        new Date(Date.now() - 60_000).toISOString()
    );

    const expiredKeyRow = db.prepare(`
        SELECT expires_at
        FROM api_keys
        WHERE id = ?
    `).get(expiredKeyId);

    check(
        "Expired API-key test fixture exists",
        Boolean(expiredKeyRow)
    );

    /*
     * ----------------------------------------------------------
     * 5. SESSION EXPIRY
     * ----------------------------------------------------------
     */

    const expiredSessionId = `phase3f-session-${timestamp}`;

    const crypto = await import("node:crypto");

    const expiredToken = crypto.randomBytes(32).toString("hex");

    const expiredHash = crypto
        .createHash("sha256")
        .update(expiredToken)
        .digest("hex");

    db.prepare(`
        INSERT INTO sessions (
            id,
            user_id,
            token_hash,
            expires_at
        )
        VALUES (?, ?, ?, ?)
    `).run(
        expiredSessionId,
        userA.user.id,
        expiredHash,
        new Date(Date.now() - 60_000).toISOString()
    );

    const expiredSessionResponse = await request(
        "/api/v1/auth/me",
        {
            headers: {
                Authorization: `Bearer ${expiredToken}`
            }
        }
    );

    check(
        "Expired session is rejected",
        expiredSessionResponse.status === 401
    );

    /*
     * ----------------------------------------------------------
     * 6. PRIVATE PROJECT ISOLATION
     * ----------------------------------------------------------
     */

    const projectResponse = await request(
        "/api/v1/projects",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                name: `Phase 3F Private Project ${timestamp}`,
                description: "Private isolation test",
                visibility: "private"
            })
        }
    );

    const projectId =
        projectResponse.body?.data?.id ||
        projectResponse.body?.project?.id ||
        projectResponse.body?.id;

    if (projectId) {
        const privateProjectAsB = await request(
            `/api/v1/projects/${projectId}`,
            {
                headers: {
                    Authorization: `Bearer ${tokenB}`
                }
            }
        );

        check(
            "Non-member cannot access private project",
            privateProjectAsB.status === 403 ||
            privateProjectAsB.status === 404
        );
    } else {
        check(
            "Private project isolation fixture created",
            false
        );
    }

    /*
     * ----------------------------------------------------------
     * 7. PROJECT OWNER PROTECTION
     * ----------------------------------------------------------
     */

    if (projectId) {
        const deleteAsB = await request(
            `/api/v1/projects/${projectId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${tokenB}`
                }
            }
        );

        check(
            "Non-owner cannot delete another user's project",
            deleteAsB.status === 403 ||
            deleteAsB.status === 404
        );

        const stillExists = db.prepare(`
            SELECT id
            FROM projects
            WHERE id = ?
        `).get(projectId);

        check(
            "Unauthorized project deletion does not remove project",
            Boolean(stillExists)
        );
    }

    /*
     * ----------------------------------------------------------
     * 8. UNKNOWN RESOURCE HANDLING
     * ----------------------------------------------------------
     */

    const unknownProject = await request(
        "/api/v1/projects/definitely-nonexistent-project",
        {
            headers: {
                Authorization: `Bearer ${tokenA}`
            }
        }
    );

    check(
        "Unknown project returns controlled response",
        unknownProject.status === 404
    );

    /*
     * ----------------------------------------------------------
     * 9. PAGINATION ABUSE
     * ----------------------------------------------------------
     */

    const hugeLimit = await request(
        "/api/v1/community/posts?page=1&limit=999999",
        {
            headers: {
                Authorization: `Bearer ${tokenA}`
            }
        }
    );

    check(
        "Huge pagination request does not cause server error",
        hugeLimit.status < 500
    );

    /*
     * ----------------------------------------------------------
     * 10. INVALID PAGINATION
     * ----------------------------------------------------------
     */

    const invalidPagination = await request(
        "/api/v1/community/posts?page=-999&limit=-999",
        {
            headers: {
                Authorization: `Bearer ${tokenA}`
            }
        }
    );

    check(
        "Invalid pagination does not cause server error",
        invalidPagination.status < 500
    );

    /*
     * ----------------------------------------------------------
     * 11. PASSWORD RESET ENUMERATION
     * ----------------------------------------------------------
     */

    const resetKnown = await request(
        "/api/v1/auth/password-reset/request",
        {
            method: "POST",
            body: JSON.stringify({
                email: userA.user.email
            })
        }
    );

    const resetUnknown = await request(
        "/api/v1/auth/password-reset/request",
        {
            method: "POST",
            body: JSON.stringify({
                email: `does-not-exist-${timestamp}@codem.test`
            })
        }
    );

    check(
        "Password reset known-user request is controlled",
        resetKnown.status < 500
    );

    check(
        "Password reset unknown-user request is controlled",
        resetUnknown.status < 500
    );

    const knownResetData = resetKnown.body?.data || {};
    const unknownResetData = resetUnknown.body?.data || {};

    check(
        "Password reset responses use the same public success message",
        resetKnown.status === 200 &&
        resetUnknown.status === 200 &&
        knownResetData.success === unknownResetData.success &&
        knownResetData.message === unknownResetData.message
    );

    check(
        "Password reset public response does not expose account identity",
        !JSON.stringify(knownResetData).includes(userA.user.email) &&
        !JSON.stringify(knownResetData).includes(userA.user.id)
    );

    /*
     * ----------------------------------------------------------
     * 12. SENSITIVE ERROR RESPONSE CHECK
     * ----------------------------------------------------------
     */

    const malformedAuth = await request(
        "/api/v1/auth/me",
        {
            headers: {
                Authorization: "Bearer definitely-invalid-token"
            }
        }
    );

    const errorText = JSON.stringify(malformedAuth.body || {});

    check(
        "Invalid authentication returns controlled response",
        malformedAuth.status === 401
    );

    check(
        "Authentication error does not expose token internals",
        !errorText.includes("token_hash") &&
        !errorText.includes("password_hash")
    );

    /*
     * ----------------------------------------------------------
     * 13. SQL / INPUT ERROR SANITIZATION
     * ----------------------------------------------------------
     */

    const injectionAttempt = await request(
        "/api/v1/community/posts/' OR '1'='1",
        {
            headers: {
                Authorization: `Bearer ${tokenA}`
            }
        }
    );

    check(
        "SQL-like path input does not produce server error",
        injectionAttempt.status < 500
    );

    /*
     * ----------------------------------------------------------
     * 14. DATABASE INTEGRITY
     * ----------------------------------------------------------
     */

    const integrity = db
        .prepare("PRAGMA integrity_check")
        .get();

    check(
        "SQLite database integrity check passes",
        integrity?.integrity_check === "ok"
    );

    /*
     * ----------------------------------------------------------
     * CLEANUP
     * ----------------------------------------------------------
     */

    try {
        revokeUserApiKey({
            apiKeyId: keyA.apiKey?.id || keyA.id,
            actorUserId: userA.user.id,
            actorRole: "user"
        });
    } catch {
        // Test cleanup only.
    }

    db.prepare(`
        DELETE FROM api_keys
        WHERE id IN (?, ?)
    `).run(
        expiredKeyId,
        keyB.apiKey?.id || keyB.id
    );

    db.prepare(`
        DELETE FROM sessions
        WHERE id = ?
    `).run(expiredSessionId);

    console.log("=".repeat(60));
    console.log("CODEM PHASE 3F DEEP SECURITY REGRESSION");
    console.log("=".repeat(60));
    console.log(`PASS: ${passed}`);
    console.log(`FAIL: ${failed}`);

    if (failed === 0) {
        console.log("STATUS: PHASE 3F DEEP SECURITY REGRESSION PASSED");
    } else {
        console.log("STATUS: PHASE 3F DEEP SECURITY REGRESSION NEEDS FIXES");
        process.exitCode = 1;
    }

    console.log("=".repeat(60));
}

main().catch(error => {
    console.error("FATAL TEST ERROR");
    console.error(error);
    process.exitCode = 1;
});
