import assert from "node:assert/strict";
import crypto from "node:crypto";

import db from "../src/database/db.js";
import app from "../src/app.js";

function pass(message) {
    console.log(`PASS: ${message}`);
}

function uniqueEmail(prefix) {
    return `${prefix}-${Date.now()}-${crypto
        .randomBytes(4)
        .toString("hex")}@codem.test`;
}

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const server = app.listen(0, "127.0.0.1", async () => {
            try {
                const port = server.address().port;

                const headers = {
                    "User-Agent": "Codem-HTTP-Audit-Test"
                };

                if (body !== null) {
                    headers["Content-Type"] =
                        "application/json";
                }

                if (token) {
                    headers.Authorization =
                        `Bearer ${token}`;
                }

                const response = await fetch(
                    `http://127.0.0.1:${port}${path}`,
                    {
                        method,
                        headers,
                        body:
                            body === null
                                ? undefined
                                : JSON.stringify(body)
                    }
                );

                const text = await response.text();

                let data;

                try {
                    data = JSON.parse(text);
                } catch {
                    data = text;
                }

                server.close(() => {
                    resolve({
                        status: response.status,
                        data
                    });
                });
            } catch (error) {
                server.close(() => reject(error));
            }
        });
    });
}

try {
    const adminEmail =
        uniqueEmail("http-audit-admin");

    const targetEmail =
        uniqueEmail("http-audit-target");

    const normalEmail =
        uniqueEmail("http-audit-normal");

    const adminUsername =
        `httpauditadmin${Date.now()}`;

    const targetUsername =
        `httpaudittarget${Date.now()}`;

    const normalUsername =
        `httpauditnormal${Date.now()}`;

    const password =
        "HttpAuditPassword123!";

    const registerAdmin = await request(
        "POST",
        "/api/v1/auth/register",
        {
            email: adminEmail,
            username: adminUsername,
            password
        }
    );

    assert.equal(registerAdmin.status, 201);

    const registerTarget = await request(
        "POST",
        "/api/v1/auth/register",
        {
            email: targetEmail,
            username: targetUsername,
            password
        }
    );

    assert.equal(registerTarget.status, 201);

    const registerNormal = await request(
        "POST",
        "/api/v1/auth/register",
        {
            email: normalEmail,
            username: normalUsername,
            password
        }
    );

    assert.equal(registerNormal.status, 201);

    pass("HTTP test accounts created");

    const adminUser = db.prepare(`
        SELECT id
        FROM users
        WHERE email = ?
    `).get(adminEmail);

    const targetUser = db.prepare(`
        SELECT id
        FROM users
        WHERE email = ?
    `).get(targetEmail);

    assert.ok(adminUser);
    assert.ok(targetUser);

    db.prepare(`
        UPDATE users
        SET role = 'admin'
        WHERE id = ?
    `).run(adminUser.id);

    const loginResponse = await request(
        "POST",
        "/api/v1/auth/login",
        {
            email: adminEmail,
            password
        }
    );

    assert.equal(loginResponse.status, 200);

    const token =
        loginResponse.data.data.token;

    assert.ok(token);

    pass("HTTP admin authentication succeeded");

    const before = db.prepare(`
        SELECT COUNT(*) AS count
        FROM audit_logs
        WHERE resource_id = ?
        AND action = 'USER_ROLE_CHANGED'
    `).get(targetUser.id).count;

    const changeRoleResponse = await request(
        "PATCH",
        `/api/v1/admin/users/${targetUser.id}/role`,
        {
            role: "admin"
        },
        token
    );

    assert.equal(changeRoleResponse.status, 200);

    pass("HTTP admin role change succeeded");

    const audit = db.prepare(`
        SELECT
            user_id,
            action,
            resource_type,
            resource_id,
            ip_address,
            user_agent,
            metadata
        FROM audit_logs
        WHERE resource_id = ?
        AND action = 'USER_ROLE_CHANGED'
        ORDER BY created_at DESC
        LIMIT 1
    `).get(targetUser.id);

    assert.ok(audit);
    assert.equal(audit.user_id, adminUser.id);
    assert.equal(audit.action, "USER_ROLE_CHANGED");
    assert.equal(audit.resource_type, "user");
    assert.equal(audit.resource_id, targetUser.id);
    assert.ok(audit.ip_address);
    assert.equal(
        audit.user_agent,
        "Codem-HTTP-Audit-Test"
    );

    const metadata =
        JSON.parse(audit.metadata);

    assert.equal(metadata.previousRole, "user");
    assert.equal(metadata.newRole, "admin");

    pass("HTTP request generated a complete audit record");

    const after = db.prepare(`
        SELECT COUNT(*) AS count
        FROM audit_logs
        WHERE resource_id = ?
        AND action = 'USER_ROLE_CHANGED'
    `).get(targetUser.id).count;

    assert.equal(after, before + 1);

    pass("Exactly one role-change audit event was created");

    const normalLogin = await request(
        "POST",
        "/api/v1/auth/login",
        {
            email: normalEmail,
            password
        }
    );

    assert.equal(normalLogin.status, 200);

    const normalToken =
        normalLogin.data.data.token;

    const forbidden = await request(
        "GET",
        "/api/v1/admin/audit-logs",
        null,
        normalToken
    );

    assert.equal(forbidden.status, 403);

    pass("Non-admin cannot access audit logs");

    const adminLogs = await request(
        "GET",
        `/api/v1/admin/audit-logs?resourceId=${targetUser.id}&action=USER_ROLE_CHANGED`,
        null,
        token
    );

    assert.equal(adminLogs.status, 200);
    assert.ok(
        adminLogs.data.data.logs.length >= 1
    );

    pass("Admin can retrieve the generated audit log through HTTP");

    console.log("");
    console.log("============================================================");
    console.log("RESULT");
    console.log("============================================================");
    console.log("PASS: 8");
    console.log("FAIL: 0");
    console.log("STATUS: CODEM PHASE 3B HTTP AUDIT TEST PASSED");
    console.log("============================================================");

} catch (error) {
    console.error("FAIL: Phase 3B HTTP audit test");
    console.error(error);
    process.exitCode = 1;
}
