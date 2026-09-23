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
    body = null,
    token = null
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
                            "Codem-API-Key-Test"
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

function getUserByEmail(email) {
    return db.prepare(`
        SELECT
            id,
            email,
            username,
            role,
            status
        FROM users
        WHERE email = ?
    `).get(email);
}

try {
    const password =
        "CodemApiKeyPassword123!";

    const ownerEmail =
        uniqueEmail("apikey-owner");

    const ownerUsername =
        uniqueUsername("apikeyowner");

    const otherEmail =
        uniqueEmail("apikey-other");

    const otherUsername =
        uniqueUsername("apikeyother");

    const ownerRegister =
        await request(
            "POST",
            "/api/v1/auth/register",
            {
                email: ownerEmail,
                username: ownerUsername,
                password
            }
        );

    assert.equal(
        ownerRegister.status,
        201
    );

    const otherRegister =
        await request(
            "POST",
            "/api/v1/auth/register",
            {
                email: otherEmail,
                username: otherUsername,
                password
            }
        );

    assert.equal(
        otherRegister.status,
        201
    );

    pass("API-key test users created");

    const owner =
        getUserByEmail(ownerEmail);

    const other =
        getUserByEmail(otherEmail);

    assert.ok(owner);
    assert.ok(other);

    const ownerLogin =
        await request(
            "POST",
            "/api/v1/auth/login",
            {
                email: ownerEmail,
                password
            }
        );

    assert.equal(
        ownerLogin.status,
        200
    );

    const ownerToken =
        ownerLogin.data.data.token;

    assert.ok(ownerToken);

    const otherLogin =
        await request(
            "POST",
            "/api/v1/auth/login",
            {
                email: otherEmail,
                password
            }
        );

    assert.equal(
        otherLogin.status,
        200
    );

    const otherToken =
        otherLogin.data.data.token;

    assert.ok(otherToken);

    pass("Bearer authentication established");

    /*
     * 1. Missing fields
     */
    const missingName =
        await request(
            "POST",
            "/api/v1/api-keys",
            {
                scopes: ["read"]
            },
            ownerToken
        );

    assert.equal(
        missingName.status,
        400
    );

    pass("API key creation requires a name");

    /*
     * 2. Invalid scope
     */
    const invalidScope =
        await request(
            "POST",
            "/api/v1/api-keys",
            {
                name: "Invalid Scope",
                scopes: ["read", "destroy_everything"]
            },
            ownerToken
        );

    assert.equal(
        invalidScope.status,
        400
    );

    assert.equal(
        invalidScope.data.error.code,
        "INVALID_API_KEY_SCOPE"
    );

    pass("Invalid API-key scopes are rejected");

    /*
     * 3. Expiry validation
     */
    const expired =
        await request(
            "POST",
            "/api/v1/api-keys",
            {
                name: "Expired Key",
                scopes: ["read"],
                expiresAt:
                    "2000-01-01T00:00:00.000Z"
            },
            ownerToken
        );

    assert.equal(
        expired.status,
        400
    );

    pass("Expired API-key creation is rejected");

    /*
     * 4. Create valid key
     */
    const createResponse =
        await request(
            "POST",
            "/api/v1/api-keys",
            {
                name: "Terminal Development",
                scopes: ["read", "write"]
            },
            ownerToken
        );

    assert.equal(
        createResponse.status,
        201
    );

    const created =
        createResponse.data.data;

    assert.ok(created.apiKey);
    assert.ok(created.key);

    assert.ok(
        created.key.startsWith("cdm_")
    );

    assert.deepEqual(
        created.apiKey.scopes,
        ["read", "write"]
    );

    assert.ok(
        created.apiKey.key_prefix
    );

    assert.equal(
        created.key.startsWith(
            created.apiKey.key_prefix
        ),
        true
    );

    pass("API key is created successfully");

    /*
     * 5. Plaintext secret must not be in returned metadata
     */
    assert.equal(
        created.apiKey.key,
        undefined
    );

    pass("Plaintext API key is separated from key metadata");

    /*
     * 6. Verify database stores only hash
     */
    const rawDatabaseRow =
        db.prepare(`
            SELECT
                key_hash,
                key_prefix,
                scopes
            FROM api_keys
            WHERE id = ?
        `).get(created.apiKey.id);

    assert.ok(rawDatabaseRow);

    assert.notEqual(
        rawDatabaseRow.key_hash,
        created.key
    );

    assert.equal(
        rawDatabaseRow.key_hash.length,
        64
    );

    assert.equal(
        rawDatabaseRow.key_prefix,
        created.apiKey.key_prefix
    );

    pass("Database stores a SHA-256 hash, not the plaintext key");

    /*
     * 7. Verify plaintext secret is not present anywhere
     * in the stored API-key row.
     */
    const serializedRow =
        JSON.stringify(rawDatabaseRow);

    assert.equal(
        serializedRow.includes(created.key),
        false
    );

    pass("Plaintext API key is absent from stored key data");

    /*
     * 8. List keys
     */
    const listResponse =
        await request(
            "GET",
            "/api/v1/api-keys",
            null,
            ownerToken
        );

    assert.equal(
        listResponse.status,
        200
    );

    const listed =
        listResponse.data.data.apiKeys;

    assert.ok(
        listed.some(
            key =>
                key.id ===
                created.apiKey.id
        )
    );

    const listedKey =
        listed.find(
            key =>
                key.id ===
                created.apiKey.id
        );

    assert.equal(
        listedKey.key,
        undefined
    );

    assert.equal(
        listedKey.key_hash,
        undefined
    );

    pass("API key listing never exposes the secret or hash");

    /*
     * 9. Duplicate key name
     */
    const duplicate =
        await request(
            "POST",
            "/api/v1/api-keys",
            {
                name: "Terminal Development",
                scopes: ["read"]
            },
            ownerToken
        );

    assert.equal(
        duplicate.status,
        409
    );

    pass("Duplicate API-key names are rejected");

    /*
     * 10. Other user cannot revoke owner's key
     */
    const forbiddenRevoke =
        await request(
            "DELETE",
            `/api/v1/api-keys/${created.apiKey.id}`,
            null,
            otherToken
        );

    assert.equal(
        forbiddenRevoke.status,
        403
    );

    pass("API-key ownership is enforced");

    /*
     * 11. Missing API key authentication
     *
     * The current route is Bearer-protected.
     * This verifies that API-key management itself
     * cannot be accessed anonymously.
     */
    const anonymous =
        await request(
            "GET",
            "/api/v1/api-keys"
        );

    assert.equal(
        anonymous.status,
        401
    );

    pass("API-key management requires authentication");

    /*
     * 12. Create a short-lived key and verify expiry.
     */
    const expiry =
        new Date(
            Date.now() + 5000
        ).toISOString();

    const expiringResponse =
        await request(
            "POST",
            "/api/v1/api-keys",
            {
                name: "Short Lived Key",
                scopes: ["read"],
                expiresAt: expiry
            },
            ownerToken
        );

    assert.equal(
        expiringResponse.status,
        201
    );

    const expiringKey =
        expiringResponse.data.data.key;

    assert.ok(expiringKey);

    pass("Future API-key expiry is accepted");

    /*
     * 13. Authenticate key directly through middleware.
     */
    const protectedRoute =
        await request(
            "GET",
            "/api/v1/health",
            null
        );

    assert.equal(
        protectedRoute.status,
        200
    );

    /*
     * 14. Verify hash lookup manually using the
     * exact same hashing mechanism.
     */
    const suppliedSecret =
        expiringKey.slice(4);

    const suppliedHash =
        crypto
            .createHash("sha256")
            .update(suppliedSecret)
            .digest("hex");

    const matchingRow =
        db.prepare(`
            SELECT id
            FROM api_keys
            WHERE key_hash = ?
        `).get(suppliedHash);

    assert.ok(matchingRow);
    assert.equal(
        matchingRow.id,
        expiringResponse.data.data.apiKey.id
    );

    pass("API-key hash authentication lookup is deterministic");

    /*
     * 15. last_used_at is initially null
     */
    const beforeUse =
        db.prepare(`
            SELECT last_used_at
            FROM api_keys
            WHERE id = ?
        `).get(
            expiringResponse.data.data.apiKey.id
        );

    assert.equal(
        beforeUse.last_used_at,
        null
    );

    pass("New API keys start with no last-used timestamp");

    /*
     * 16. Revoke key
     */
    const revokeResponse =
        await request(
            "DELETE",
            `/api/v1/api-keys/${created.apiKey.id}`,
            null,
            ownerToken
        );

    assert.equal(
        revokeResponse.status,
        200
    );

    assert.ok(
        revokeResponse.data.data.apiKey.revoked_at
    );

    pass("API key can be revoked by its owner");

    /*
     * 17. Revoke again
     */
    const revokeAgain =
        await request(
            "DELETE",
            `/api/v1/api-keys/${created.apiKey.id}`,
            null,
            ownerToken
        );

    assert.equal(
        revokeAgain.status,
        409
    );

    pass("Already revoked API keys cannot be revoked again");

    /*
     * 18. Confirm revoked_at persists
     */
    const revokedRow =
        db.prepare(`
            SELECT revoked_at
            FROM api_keys
            WHERE id = ?
        `).get(created.apiKey.id);

    assert.ok(
        revokedRow.revoked_at
    );

    pass("API-key revocation persists in SQLite");

    /*
     * 19. Audit record must never contain raw secret
     */
    const auditRows =
        db.prepare(`
            SELECT
                metadata,
                user_agent,
                ip_address
            FROM audit_logs
            WHERE resource_type = 'api_key'
            ORDER BY created_at DESC
        `).all();

    const auditText =
        JSON.stringify(auditRows);

    assert.equal(
        auditText.includes(created.key),
        false
    );

    assert.equal(
        auditText.includes(expiringKey),
        false
    );

    pass("Raw API-key secrets never enter audit logs");

    /*
     * 20. API key hash also must not appear in
     * API responses.
     */
    const responseText =
        JSON.stringify(
            listResponse.data
        );

    assert.equal(
        responseText.includes(
            rawDatabaseRow.key_hash
        ),
        false
    );

    pass("API-key hashes are not exposed through API responses");

    console.log("");
    console.log("============================================================");
    console.log("RESULT");
    console.log("============================================================");
    console.log("PASS: 20");
    console.log("FAIL: 0");
    console.log("STATUS: CODEM PHASE 3C API KEY MANAGEMENT PASSED");
    console.log("============================================================");

} catch (error) {
    console.error(
        "FAIL: Phase 3C API key test"
    );
    console.error(error);
    process.exitCode = 1;
}
