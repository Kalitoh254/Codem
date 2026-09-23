import app from "../src/app.js";
import { register, login, logoutAll } from "../src/services/authService.js";
import { createUserApiKey, revokeUserApiKey } from "../src/services/apiKeyService.js";

const server = app.listen(0, "127.0.0.1", async () => {
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    let pass = 0;
    let fail = 0;

    function check(name, condition, detail = "") {
        if (condition) {
            pass++;
            console.log(`PASS: ${name}`);
        } else {
            fail++;
            console.log(`FAIL: ${name}${detail ? ` - ${detail}` : ""}`);
        }
    }

    async function request(path, options = {}) {
        return fetch(`${base}${path}`, options);
    }

    const unique = Date.now();

    try {
        console.log("\n============================================================");
        console.log("CODEM PHASE 3E SECURITY REGRESSION");
        console.log("============================================================\n");

        // ------------------------------------------------------------
        // TEST USERS
        // ------------------------------------------------------------

        const normalEmail = `security-user-${unique}@example.com`;
        const adminEmail = `security-admin-${unique}@example.com`;

        const normal = await register({
            email: normalEmail,
            username: `secuser${unique}`,
            password: "SecurityPassword123!"
        });

        const admin = await register({
            email: adminEmail,
            username: `secadmin${unique}`,
            password: "SecurityPassword123!"
        });

        // Promote test admin directly at service/database level.
        const { default: db } = await import("../src/database/db.js");

        db.prepare(`
            UPDATE users
            SET role = 'admin'
            WHERE id = ?
        `).run(admin.user.id);

        const normalLogin = await login({
            email: normalEmail,
            password: "SecurityPassword123!"
        });

        const adminLogin = await login({
            email: adminEmail,
            password: "SecurityPassword123!"
        });

        const normalToken = normalLogin.token;
        const adminToken = adminLogin.token;

        check(
            "Normal test user can authenticate",
            Boolean(normalToken)
        );

        check(
            "Admin test user can authenticate",
            Boolean(adminToken)
        );

        // ------------------------------------------------------------
        // PRIVILEGE ESCALATION
        // ------------------------------------------------------------

        const normalAdminAccess = await request(
            "/api/v1/admin/users",
            {
                headers: {
                    Authorization: `Bearer ${normalToken}`
                }
            }
        );

        check(
            "Normal user cannot access admin endpoints",
            normalAdminAccess.status === 403
        );

        const selfRoleTamper = await request(
            `/api/v1/admin/users/${normal.user.id}/role`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${normalToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    role: "admin"
                })
            }
        );

        check(
            "Normal user cannot promote themselves",
            selfRoleTamper.status === 403
        );

        const selfStatusTamper = await request(
            `/api/v1/admin/users/${normal.user.id}/status`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${normalToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "active"
                })
            }
        );

        check(
            "Normal user cannot manipulate account status",
            selfStatusTamper.status === 403
        );

        // ------------------------------------------------------------
        // ADMIN SELF-PROTECTION
        // ------------------------------------------------------------

        const adminRoleChange = await request(
            `/api/v1/admin/users/${admin.user.id}/role`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    role: "user"
                })
            }
        );

        check(
            "Admin cannot change own role",
            adminRoleChange.status === 400 ||
            adminRoleChange.status === 403
        );

        const adminSuspend = await request(
            `/api/v1/admin/users/${admin.user.id}/status`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "suspended"
                })
            }
        );

        check(
            "Admin cannot suspend themselves",
            adminSuspend.status === 400 ||
            adminSuspend.status === 403
        );

        // ------------------------------------------------------------
        // API KEY SECURITY
        // ------------------------------------------------------------

        const apiKey = createUserApiKey({
            userId: normal.user.id,
            name: `security-key-${unique}`,
            scopes: ["read"]
        });

        check(
            "API key is generated",
            Boolean(apiKey.key)
        );

        check(
            "API key plaintext is returned",
            typeof apiKey.key === "string" &&
            apiKey.key.startsWith("cdm_")
        );

        check(
            "API key hash is not returned",
            !Object.prototype.hasOwnProperty.call(
                apiKey,
                "key_hash"
            )
        );

        const readIdentity = await request(
            "/api/v1/developer/identity",
            {
                headers: {
                    "X-API-Key": apiKey.key
                }
            }
        );

        check(
            "Read-scoped API key can access read endpoint",
            readIdentity.status === 200
        );

        const writeAttempt = await request(
            "/api/v1/developer/write-test",
            {
                method: "POST",
                headers: {
                    "X-API-Key": apiKey.key,
                    "Content-Type": "application/json"
                },
                body: "{}"
            }
        );

        check(
            "Read-scoped API key cannot perform write operation",
            writeAttempt.status === 403
        );

        revokeUserApiKey({
            apiKeyId: apiKey.apiKey.id,
            actorUserId: normal.user.id,
            actorRole: "user"
        });

        const revokedKeyAttempt = await request(
            "/api/v1/developer/identity",
            {
                headers: {
                    "X-API-Key": apiKey.key
                }
            }
        );

        check(
            "Revoked API key is rejected",
            revokedKeyAttempt.status === 401
        );

        // ------------------------------------------------------------
        // SESSION REVOCATION
        // ------------------------------------------------------------

        const sessionLogin = await login({
            email: normalEmail,
            password: "SecurityPassword123!"
        });

        const sessionToken = sessionLogin.token;

        const beforeRevoke = await request(
            "/api/v1/users",
            {
                headers: {
                    Authorization: `Bearer ${sessionToken}`
                }
            }
        );

        check(
            "Authenticated session works before revocation",
            beforeRevoke.status !== 401
        );

        await logoutAll(normal.user.id);

        const afterRevoke = await request(
            "/api/v1/users",
            {
                headers: {
                    Authorization: `Bearer ${sessionToken}`
                }
            }
        );

        check(
            "Revoked session is rejected",
            afterRevoke.status === 401
        );

        // ------------------------------------------------------------
        // SUSPENDED USER
        // ------------------------------------------------------------

        const suspendedLogin = await login({
            email: normalEmail,
            password: "SecurityPassword123!"
        });

        const suspension = await request(
            `/api/v1/admin/users/${normal.user.id}/status`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "suspended"
                })
            }
        );

        check(
            "Admin can suspend another user",
            suspension.status === 200
        );

        const suspendedAccess = await request(
            "/api/v1/users",
            {
                headers: {
                    Authorization:
                        `Bearer ${suspendedLogin.token}`
                }
            }
        );

        check(
            "Suspended user's session is rejected",
            suspendedAccess.status === 401 ||
            suspendedAccess.status === 403
        );

        // Restore test user so cleanup can operate normally.
        await request(
            `/api/v1/admin/users/${normal.user.id}/status`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "active"
                })
            }
        );

        // ------------------------------------------------------------
        // SENSITIVE DATA
        // ------------------------------------------------------------

        const me = await request(
            "/api/v1/auth/me",
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            }
        );

        const meText = await me.text();

        check(
            "User response does not expose password hash",
            !meText.includes("password_hash")
        );

        check(
            "User response does not expose session token",
            !meText.includes("token_hash")
        );

        check(
            "User response does not expose API-key hash",
            !meText.includes("key_hash")
        );

        // ------------------------------------------------------------
        // UNKNOWN USER / ENUMERATION
        // ------------------------------------------------------------

        const unknownUser = await request(
            "/api/v1/admin/users/definitely-nonexistent-user",
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            }
        );

        check(
            "Authenticated admin receives controlled 404 for unknown user",
            unknownUser.status === 404
        );

        // ------------------------------------------------------------
        // DATABASE INTEGRITY
        // ------------------------------------------------------------

        const integrity = db
            .prepare("PRAGMA integrity_check")
            .get();

        check(
            "SQLite database integrity check passes",
            integrity.integrity_check === "ok"
        );

        // ------------------------------------------------------------
        // CLEANUP
        // ------------------------------------------------------------

        await logoutAll(admin.user.id);
        await logoutAll(normal.user.id);

        db.prepare(`
            DELETE FROM users
            WHERE id IN (?, ?)
        `).run(normal.user.id, admin.user.id);

        console.log("\n============================================================");
        console.log("CODEM PHASE 3E SECURITY REGRESSION");
        console.log("============================================================");
        console.log(`PASS: ${pass}`);
        console.log(`FAIL: ${fail}`);

        if (fail === 0) {
            console.log(
                "STATUS: PHASE 3E SECURITY REGRESSION PASSED"
            );
        } else {
            console.log(
                "STATUS: PHASE 3E SECURITY REGRESSION NEEDS FIXES"
            );
        }

        console.log("============================================================");

        process.exitCode = fail === 0 ? 0 : 1;

    } catch (error) {
        console.error("SECURITY REGRESSION ERROR:", error);
        process.exitCode = 1;
    } finally {
        server.close();
    }
});
