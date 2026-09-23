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

function uniqueUsername(prefix) {
    return `${prefix}${Date.now()}${crypto
        .randomBytes(2)
        .toString("hex")}`;
}

async function request(
    method,
    path,
    {
        body = null,
        bearerToken = null,
        apiKey = null
    } = {}
) {
    return new Promise((resolve, reject) => {
        const server = app.listen(
            0,
            "127.0.0.1",
            async () => {
                try {
                    const port =
                        server.address().port;

                    const headers = {
                        "User-Agent":
                            "Codem-API-Key-Runtime-Test"
                    };

                    if (body !== null) {
                        headers["Content-Type"] =
                            "application/json";
                    }

                    if (bearerToken) {
                        headers.Authorization =
                            `Bearer ${bearerToken}`;
                    }

                    if (apiKey) {
                        headers["X-API-Key"] =
                            apiKey;
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

                    const text =
                        await response.text();

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
                    server.close(() =>
                        reject(error)
                    );
                }
            }
        );
    });
}

try {
    const password =
        "CodemRuntimeApiKey123!";

    const email =
        uniqueEmail("runtime-owner");

    const username =
        uniqueUsername("runtimeowner");

    const register =
        await request(
            "POST",
            "/api/v1/auth/register",
            {
                body: {
                    email,
                    username,
                    password
                }
            }
        );

    assert.equal(
        register.status,
        201
    );

    pass("Runtime test user created");

    const login =
        await request(
            "POST",
            "/api/v1/auth/login",
            {
                body: {
                    email,
                    password
                }
            }
        );

    assert.equal(
        login.status,
        200
    );

    const bearerToken =
        login.data.data.token;

    assert.ok(bearerToken);

    const create =
        await request(
            "POST",
            "/api/v1/api-keys",
            {
                body: {
                    name: "Runtime Read Write",
                    scopes: ["read", "write"]
                },
                bearerToken
            }
        );

    assert.equal(
        create.status,
        201
    );

    const apiKey =
        create.data.data.key;

    const apiKeyId =
        create.data.data.apiKey.id;

    assert.ok(apiKey);
    assert.ok(apiKeyId);

    pass("Runtime API key created");

    /*
     * 1. Missing API key
     */
    const missing =
        await request(
            "GET",
            "/api/v1/developer/identity"
        );

    assert.equal(
        missing.status,
        401
    );

    assert.equal(
        missing.data.error.code,
        "API_KEY_REQUIRED"
    );

    pass("Protected developer endpoint rejects missing API key");

    /*
     * 2. Invalid API key
     */
    const invalid =
        await request(
            "GET",
            "/api/v1/developer/identity",
            {
                apiKey: "cdm_invalid_key_123456789"
            }
        );

    assert.equal(
        invalid.status,
        401
    );

    assert.equal(
        invalid.data.error.code,
        "INVALID_API_KEY"
    );

    pass("Invalid API key is rejected");

    /*
     * 3. Valid API key
     */
    const identity =
        await request(
            "GET",
            "/api/v1/developer/identity",
            {
                apiKey
            }
        );

    assert.equal(
        identity.status,
        200
    );

    assert.equal(
        identity.data.data.authentication,
        "api_key"
    );

    assert.equal(
        identity.data.data.user.username,
        username
    );

    assert.equal(
        identity.data.data.apiKey.id,
        apiKeyId
    );

    assert.deepEqual(
        identity.data.data.apiKey.scopes,
        ["read", "write"]
    );

    pass("Valid API key authenticates successfully");

    /*
     * 4. API key metadata must not expose secret/hash
     */
    const identityText =
        JSON.stringify(identity.data);

    assert.equal(
        identityText.includes(apiKey),
        false
    );

    assert.equal(
        identityText.includes("key_hash"),
        false
    );

    pass("Runtime API responses do not expose API-key secrets");

    /*
     * 5. last_used_at should now be populated
     */
    const used =
        db.prepare(`
            SELECT last_used_at
            FROM api_keys
            WHERE id = ?
        `).get(apiKeyId);

    assert.ok(
        used.last_used_at
    );

    pass("API-key usage updates last_used_at");

    /*
     * 6. Read scope permits read endpoint
     */
    const read =
        await request(
            "GET",
            "/api/v1/developer/identity",
            {
                apiKey
            }
        );

    assert.equal(
        read.status,
        200
    );

    pass("Read scope permits read operation");

    /*
     * 7. Write scope permits write endpoint
     */
    const write =
        await request(
            "POST",
            "/api/v1/developer/write-test",
            {
                apiKey
            }
        );

    assert.equal(
        write.status,
        200
    );

    assert.equal(
        write.data.data.operation,
        "write"
    );

    pass("Write scope permits write operation");

    /*
     * 8. Create read-only key
     */
    const readOnlyCreate =
        await request(
            "POST",
            "/api/v1/api-keys",
            {
                body: {
                    name: "Runtime Read Only",
                    scopes: ["read"]
                },
                bearerToken
            }
        );

    assert.equal(
        readOnlyCreate.status,
        201
    );

    const readOnlyKey =
        readOnlyCreate.data.data.key;

    pass("Read-only API key created");

    /*
     * 9. Read-only key can read
     */
    const readOnlyRead =
        await request(
            "GET",
            "/api/v1/developer/identity",
            {
                apiKey: readOnlyKey
            }
        );

    assert.equal(
        readOnlyRead.status,
        200
    );

    pass("Read-only key can access read endpoint");

    /*
     * 10. Read-only key cannot write
     */
    const readOnlyWrite =
        await request(
            "POST",
            "/api/v1/developer/write-test",
            {
                apiKey: readOnlyKey
            }
        );

    assert.equal(
        readOnlyWrite.status,
        403
    );

    assert.equal(
        readOnlyWrite.data.error.code,
        "INSUFFICIENT_API_KEY_SCOPE"
    );

    pass("Read-only key is blocked from write operation");

    /*
     * 11. Bearer token alone cannot satisfy API-key middleware
     */
    const bearerOnly =
        await request(
            "GET",
            "/api/v1/developer/identity",
            {
                bearerToken
            }
        );

    assert.equal(
        bearerOnly.status,
        401
    );

    pass("Bearer authentication cannot bypass API-key middleware");

    /*
     * 12. Revoke primary API key
     */
    const revoke =
        await request(
            "DELETE",
            `/api/v1/api-keys/${apiKeyId}`,
            {
                bearerToken
            }
        );

    assert.equal(
        revoke.status,
        200
    );

    pass("Runtime API key revoked");

    /*
     * 13. Revoked key no longer works
     */
    const revoked =
        await request(
            "GET",
            "/api/v1/developer/identity",
            {
                apiKey
            }
        );

    assert.equal(
        revoked.status,
        401
    );

    assert.equal(
        revoked.data.error.code,
        "API_KEY_REVOKED"
    );

    pass("Revoked API key is rejected");

    /*
     * 14. Verify revoked key cannot update last_used_at
     */
    const revokedTimestamp =
        db.prepare(`
            SELECT last_used_at
            FROM api_keys
            WHERE id = ?
        `).get(apiKeyId).last_used_at;

    await new Promise(
        resolve => setTimeout(resolve, 50)
    );

    const revokedAgain =
        await request(
            "GET",
            "/api/v1/developer/identity",
            {
                apiKey
            }
        );

    assert.equal(
        revokedAgain.status,
        401
    );

    const afterRevokedAttempt =
        db.prepare(`
            SELECT last_used_at
            FROM api_keys
            WHERE id = ?
        `).get(apiKeyId).last_used_at;

    assert.equal(
        afterRevokedAttempt,
        revokedTimestamp
    );

    pass("Rejected revoked-key requests do not update usage timestamp");

    console.log("");
    console.log("============================================================");
    console.log("RESULT");
    console.log("============================================================");
    console.log("PASS: 14");
    console.log("FAIL: 0");
    console.log("STATUS: CODEM PHASE 3C RUNTIME API KEY AUTH PASSED");
    console.log("============================================================");

} catch (error) {
    console.error(
        "FAIL: Phase 3C runtime API-key test"
    );
    console.error(error);
    process.exitCode = 1;
}
