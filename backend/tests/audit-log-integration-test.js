import assert from "node:assert/strict";

import db from "../src/database/db.js";
import {
    register,
    login
} from "../src/services/authService.js";

import {
    changeRole,
    changeStatus,
    forceLogout
} from "../src/services/adminUserService.js";

import {
    getAuditLogs,
    AUDIT_ACTIONS
} from "../src/services/auditLogService.js";

function pass(message) {
    console.log(`PASS: ${message}`);
}

function uniqueEmail(prefix) {
    return `${prefix}-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}@codem.test`;
}

(async () => {
try {
    const adminEmail = uniqueEmail("audit-admin");
    const targetEmail = uniqueEmail("audit-target");

    await register({
        email: adminEmail,
        username: `auditadmin${Date.now()}`,
        password: "AuditTestPassword123!"
    });

    await register({
        email: targetEmail,
        username: `audittarget${Date.now()}`,
        password: "AuditTestPassword123!"
    });

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

    const adminId = adminUser.id;
    const targetId = targetUser.id;

    db.prepare(`
        UPDATE users
        SET role = 'admin'
        WHERE id = ?
    `).run(adminId);

    pass("Integration test users created");

    const adminSession = await login({
        email: adminEmail,
        password: "AuditTestPassword123!"
    });

    assert.ok(adminSession.token);

    pass("Admin session established");

    const beforeRole = getAuditLogs({
        resourceId: targetId,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        limit: 100
    }).pagination.total;

    changeRole({
        targetUserId: targetId,
        role: "admin",
        adminUserId: adminId,
        ipAddress: "10.0.0.1",
        userAgent: "Codem-Integration-Test"
    });

    const afterRole = getAuditLogs({
        resourceId: targetId,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        limit: 100
    });

    assert.equal(
        afterRole.pagination.total,
        beforeRole + 1
    );

    const roleLog = afterRole.logs[0];

    assert.equal(roleLog.user_id, adminId);
    assert.equal(roleLog.resource_id, targetId);
    assert.equal(roleLog.ip_address, "10.0.0.1");
    assert.equal(
        roleLog.user_agent,
        "Codem-Integration-Test"
    );

    const roleMetadata =
        roleLog.metadata;

    assert.equal(roleMetadata.previousRole, "user");
    assert.equal(roleMetadata.newRole, "admin");

    pass("Role change creates the correct audit event");

    changeStatus({
        targetUserId: targetId,
        status: "suspended",
        adminUserId: adminId,
        ipAddress: "10.0.0.2",
        userAgent: "Codem-Integration-Test"
    });

    const statusLogs = getAuditLogs({
        resourceId: targetId,
        action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
        limit: 100
    });

    assert.ok(statusLogs.pagination.total >= 1);

    const statusLog = statusLogs.logs[0];

    assert.equal(statusLog.user_id, adminId);
    assert.equal(statusLog.resource_id, targetId);

    const statusMetadata =
        statusLog.metadata;

    assert.equal(statusMetadata.previousStatus, "active");
    assert.equal(statusMetadata.newStatus, "suspended");

    pass("Status change creates the correct audit event");

    forceLogout(
        targetId,
        adminId,
        "10.0.0.3",
        "Codem-Integration-Test"
    );

    const sessionLogs = getAuditLogs({
        resourceId: targetId,
        action: AUDIT_ACTIONS.USER_SESSIONS_REVOKED,
        limit: 100
    });

    assert.ok(sessionLogs.pagination.total >= 1);

    const sessionLog = sessionLogs.logs[0];

    assert.equal(
        sessionLog.user_id,
        adminId
    );

    assert.equal(
        sessionLog.resource_id,
        targetId
    );

    assert.equal(
        sessionLog.ip_address,
        "10.0.0.3"
    );

    pass("Session revocation creates the correct audit event");

    const totalAuditEvents = getAuditLogs({
        resourceId: targetId,
        limit: 100
    });

    assert.ok(
        totalAuditEvents.pagination.total >= 3
    );

    pass("Complete admin action audit trail exists");

    console.log("");
    console.log("============================================================");
    console.log("RESULT");
    console.log("============================================================");
    console.log("PASS: 7");
    console.log("FAIL: 0");
    console.log("STATUS: CODEM PHASE 3B INTEGRATION PASSED");
    console.log("============================================================");

} catch (error) {
    console.error("FAIL: Phase 3B integration test");
    console.error(error);
    process.exitCode = 1;
}
})();
