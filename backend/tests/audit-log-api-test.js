import assert from "node:assert/strict";
import crypto from "node:crypto";

import {
    recordAuditEvent,
    AUDIT_ACTIONS,
    getAuditLogs
} from "../src/services/auditLogService.js";

import db from "../src/database/db.js";

const adminUser = db.prepare(`
    SELECT id
    FROM users
    LIMIT 1
`).get();

if (!adminUser) {
    throw new Error(
        "No users exist in the database. Run the admin API test first."
    );
}

const adminId = adminUser.id;
const targetId = crypto.randomUUID();

function pass(message) {
    console.log(`PASS: ${message}`);
}

function fail(message, error) {
    console.error(`FAIL: ${message}`);
    console.error(error);
    process.exitCode = 1;
}

try {
    const result = recordAuditEvent({
        userId: adminId,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        resourceType: "user",
        resourceId: targetId,
        ipAddress: "127.0.0.1",
        userAgent: "Codem-Test-Agent",
        metadata: {
            previousRole: "user",
            newRole: "admin"
        }
    });

    assert.ok(result);
    assert.equal(result.user_id, adminId);
    assert.equal(result.action, "USER_ROLE_CHANGED");
    assert.equal(result.resource_type, "user");
    assert.equal(result.resource_id, targetId);
    assert.equal(result.ip_address, "127.0.0.1");
    assert.equal(result.user_agent, "Codem-Test-Agent");

    pass("Audit event created");

    const parsedMetadata =
        JSON.parse(result.metadata);

    assert.equal(parsedMetadata.previousRole, "user");
    assert.equal(parsedMetadata.newRole, "admin");

    pass("Audit metadata stored correctly");

    const sensitiveResult = recordAuditEvent({
        userId: adminId,
        action: "SECURITY_TEST",
        resourceType: "security",
        resourceId: "test",
        metadata: {
            safeField: "visible",
            password: "should-not-exist",
            password_hash: "should-not-exist",
            token: "should-not-exist",
            access_token: "should-not-exist",
            refresh_token: "should-not-exist",
            api_key: "should-not-exist",
            secret: "should-not-exist",
            authorization: "Bearer secret"
        }
    });

    const sensitiveMetadata =
        JSON.parse(sensitiveResult.metadata);

    assert.equal(
        sensitiveMetadata.safeField,
        "visible"
    );

    for (const key of [
        "password",
        "password_hash",
        "token",
        "access_token",
        "refresh_token",
        "api_key",
        "secret",
        "authorization"
    ]) {
        assert.equal(
            Object.hasOwn(sensitiveMetadata, key),
            false,
            `Sensitive key leaked: ${key}`
        );
    }

    pass("Sensitive audit metadata is filtered");

    const listResult = getAuditLogs({
        userId: adminId,
        page: 1,
        limit: 10
    });

    assert.ok(Array.isArray(listResult.logs));
    assert.ok(listResult.logs.length >= 2);
    assert.ok(listResult.pagination);
    assert.ok(listResult.pagination.total >= 2);

    pass("Audit logs can be listed");

    const matchingRoleChange =
        listResult.logs.find(
            log =>
                log.action ===
                AUDIT_ACTIONS.USER_ROLE_CHANGED
                &&
                log.resource_id === targetId
        );

    assert.ok(matchingRoleChange);

    pass("Audit log filtering returns the expected event");

    assert.equal(
        matchingRoleChange.user_id,
        adminId
    );

    assert.equal(
        matchingRoleChange.ip_address,
        "127.0.0.1"
    );

    assert.equal(
        matchingRoleChange.user_agent,
        "Codem-Test-Agent"
    );

    pass("Audit actor and request metadata are preserved");

    const schemaCheck = db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        AND name = 'audit_logs'
    `).get();

    assert.ok(schemaCheck);

    pass("Audit log database table exists");

    const rawRows = db.prepare(`
        SELECT *
        FROM audit_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).all(adminId);

    assert.ok(rawRows.length >= 2);

    pass("Audit records persist in SQLite");

    console.log("");
    console.log("============================================================");
    console.log("RESULT");
    console.log("============================================================");
    console.log("PASS: Phase 3B audit logging checks completed");
    console.log("FAIL: 0");
    console.log("STATUS: CODEM PHASE 3B AUDIT LOGGING PASSED");
    console.log("============================================================");

} catch (error) {
    fail("Phase 3B audit logging test", error);
}
