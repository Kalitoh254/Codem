import crypto from "node:crypto";

import db from "../src/database/db.js";
import app from "../src/app.js";

const BASE_URL = "http://127.0.0.1:5000";

let server;

let adminToken;
let userToken;

let adminId;
let userId;

let pass = 0;
let fail = 0;

function logPass(message) {
    pass++;
    console.log(`PASS: ${message}`);
}

function logFail(message, details = "") {
    fail++;
    console.log(`FAIL: ${message}`);
    if (details) {
        console.log(`     ${details}`);
    }
}

async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    return {
        status: response.status,
        data
    };
}

function expect(condition, message, details = "") {
    if (condition) {
        logPass(message);
    } else {
        logFail(message, details);
    }
}

async function createTestUser({
    email,
    username,
    password
}) {
    return request("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
            email,
            username,
            password,
            displayName: username
        })
    });
}

async function login(email, password) {
    return request("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password
        })
    });
}

try {
    server = app.listen(5001);

    const testPort = 5001;

    async function testRequest(path, options = {}) {
        const response = await fetch(`http://127.0.0.1:${testPort}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        return {
            status: response.status,
            data
        };
    }

    const suffix = crypto.randomBytes(4).toString("hex");

    const adminEmail = `admin-${suffix}@codem.test`;
    const adminUsername = `admin_${suffix}`;

    const userEmail = `user-${suffix}@codem.test`;
    const userUsername = `user_${suffix}`;

    const password = "CodemTestPassword123!";

    const adminRegistration = await testRequest(
        "/api/v1/auth/register",
        {
            method: "POST",
            body: JSON.stringify({
                email: adminEmail,
                username: adminUsername,
                password,
                displayName: "Codem Admin Test"
            })
        }
    );

    expect(
        adminRegistration.status === 201 ||
        adminRegistration.status === 200,
        "Admin test account created"
    );

    adminId = adminRegistration.data?.data?.user?.id ||
        adminRegistration.data?.user?.id;

    const userRegistration = await testRequest(
        "/api/v1/auth/register",
        {
            method: "POST",
            body: JSON.stringify({
                email: userEmail,
                username: userUsername,
                password,
                displayName: "Codem User Test"
            })
        }
    );

    expect(
        userRegistration.status === 201 ||
        userRegistration.status === 200,
        "Normal test account created"
    );

    userId = userRegistration.data?.data?.user?.id ||
        userRegistration.data?.user?.id;

    expect(
        Boolean(adminId && userId),
        "Test account IDs returned"
    );

    db.prepare(`
        UPDATE users
        SET role = 'admin'
        WHERE id = ?
    `).run(adminId);

    const adminLogin = await testRequest(
        "/api/v1/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email: adminEmail,
                password
            })
        }
    );

    adminToken = adminLogin.data?.data?.token ||
        adminLogin.data?.token;

    expect(
        adminLogin.status === 200 &&
        Boolean(adminToken),
        "Admin login succeeded"
    );

    const userLogin = await testRequest(
        "/api/v1/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email: userEmail,
                password
            })
        }
    );

    userToken = userLogin.data?.data?.token ||
        userLogin.data?.token;

    expect(
        userLogin.status === 200 &&
        Boolean(userToken),
        "Normal user login succeeded"
    );

    const adminList = await testRequest(
        "/api/v1/admin/users",
        {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        }
    );

    expect(
        adminList.status === 200 &&
        Array.isArray(adminList.data?.data?.users),
        "Admin can list users"
    );

    const searchResult = await testRequest(
        `/api/v1/admin/users?search=${encodeURIComponent(userUsername)}`,
        {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        }
    );

    expect(
        searchResult.status === 200 &&
        searchResult.data?.data?.users?.some(
            user => user.id === userId
        ),
        "Admin user search returns target user"
    );

    const normalList = await testRequest(
        "/api/v1/admin/users",
        {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        }
    );

    expect(
        normalList.status === 403 &&
        normalList.data?.error?.code === "INSUFFICIENT_PERMISSIONS",
        "Normal user cannot access admin user list"
    );

    const unauthenticatedList = await testRequest(
        "/api/v1/admin/users"
    );

    expect(
        unauthenticatedList.status === 401,
        "Unauthenticated request cannot access admin API"
    );

    const adminGetUser = await testRequest(
        `/api/v1/admin/users/${userId}`,
        {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        }
    );

    expect(
        adminGetUser.status === 200 &&
        adminGetUser.data?.data?.id === userId,
        "Admin can retrieve a specific user"
    );

    const roleChange = await testRequest(
        `/api/v1/admin/users/${userId}/role`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                role: "admin"
            })
        }
    );

    expect(
        roleChange.status === 200 &&
        roleChange.data?.data?.role === "admin",
        "Admin can promote a user"
    );

    const selfRoleChange = await testRequest(
        `/api/v1/admin/users/${adminId}/role`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                role: "user"
            })
        }
    );

    expect(
        selfRoleChange.status === 403 &&
        selfRoleChange.data?.error?.code ===
            "SELF_ROLE_CHANGE_DENIED",
        "Admin cannot change their own role"
    );

    const invalidRole = await testRequest(
        `/api/v1/admin/users/${userId}/role`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                role: "superuser"
            })
        }
    );

    expect(
        invalidRole.status === 400 &&
        invalidRole.data?.error?.code === "INVALID_ROLE",
        "Invalid role is rejected"
    );

    const suspendUser = await testRequest(
        `/api/v1/admin/users/${userId}/status`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                status: "suspended"
            })
        }
    );

    expect(
        suspendUser.status === 200 &&
        suspendUser.data?.data?.status === "suspended",
        "Admin can suspend a user"
    );

    const suspendedLogin = await testRequest(
        "/api/v1/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email: userEmail,
                password
            })
        }
    );

    expect(
        suspendedLogin.status === 403 &&
        suspendedLogin.data?.error?.code === "ACCOUNT_INACTIVE",
        "Suspended user cannot log in"
    );

    const selfSuspend = await testRequest(
        `/api/v1/admin/users/${adminId}/status`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                status: "suspended"
            })
        }
    );

    expect(
        selfSuspend.status === 403 &&
        selfSuspend.data?.error?.code ===
            "SELF_SUSPENSION_DENIED",
        "Admin cannot suspend their own account"
    );

    db.prepare(`
        UPDATE users
        SET status = 'active'
        WHERE id = ?
    `).run(userId);

    const secondUserLogin = await testRequest(
        "/api/v1/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email: userEmail,
                password
            })
        }
    );

    const secondUserToken =
        secondUserLogin.data?.data?.token ||
        secondUserLogin.data?.token;

    expect(
        secondUserLogin.status === 200 &&
        Boolean(secondUserToken),
        "Reactivated user can establish a session"
    );

    const revokeSessions = await testRequest(
        `/api/v1/admin/users/${userId}/revoke-sessions`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        }
    );

    expect(
        revokeSessions.status === 200 &&
        typeof revokeSessions.data?.data?.revokedSessions ===
            "number",
        "Admin can revoke a user's sessions"
    );

    const revokedAccess = await testRequest(
        "/api/v1/auth/me",
        {
            headers: {
                Authorization: `Bearer ${secondUserToken}`
            }
        }
    );

    expect(
        revokedAccess.status === 401 &&
        revokedAccess.data?.error?.code === "SESSION_REVOKED",
        "Revoked session can no longer authenticate"
    );

    const missingUser = await testRequest(
        `/api/v1/admin/users/${crypto.randomUUID()}`,
        {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        }
    );

    expect(
        missingUser.status === 404 &&
        missingUser.data?.error?.code === "USER_NOT_FOUND",
        "Unknown admin user returns 404"
    );

    const invalidStatus = await testRequest(
        `/api/v1/admin/users/${userId}/status`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                status: "deleted"
            })
        }
    );

    expect(
        invalidStatus.status === 400 &&
        invalidStatus.data?.error?.code === "INVALID_STATUS",
        "Invalid account status is rejected"
    );

} catch (error) {
    logFail(
        "Unexpected test failure",
        error?.stack || error?.message || String(error)
    );
} finally {
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }

    if (adminId) {
        db.prepare(`
            DELETE FROM users
            WHERE id = ?
        `).run(adminId);
    }

    if (userId) {
        db.prepare(`
            DELETE FROM users
            WHERE id = ?
        `).run(userId);
    }

    console.log();
    console.log("============================================================");
    console.log("RESULT");
    console.log("============================================================");
    console.log(`PASS: ${pass}`);
    console.log(`FAIL: ${fail}`);

    if (fail === 0) {
        console.log(
            "STATUS: CODEM PHASE 3A ADMIN USER API PASSED"
        );
    } else {
        console.log(
            "STATUS: CODEM PHASE 3A ADMIN USER API FAILED"
        );
        process.exitCode = 1;
    }
}
