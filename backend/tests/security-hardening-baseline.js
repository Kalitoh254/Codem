import app from "../src/app.js";

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

    try {
        // ------------------------------------------------------------
        // 1. Security headers
        // ------------------------------------------------------------
        const root = await request("/");

        check(
            "X-Powered-By header is disabled",
            !root.headers.get("x-powered-by")
        );

        check(
            "Helmet security headers are present",
            Boolean(root.headers.get("content-security-policy")) ||
            Boolean(root.headers.get("x-content-type-options"))
        );

        // ------------------------------------------------------------
        // 2. CORS behavior
        // ------------------------------------------------------------
        const corsProbe = await request("/", {
            headers: {
                Origin: "https://evil.example"
            }
        });

        const corsOrigin =
            corsProbe.headers.get("access-control-allow-origin");

        check(
            "CORS baseline recorded",
            corsOrigin !== null,
            `allow-origin=${corsOrigin}`
        );

        check(
            "CORS credential behavior is visible",
            corsProbe.headers.get("access-control-allow-credentials") === "true"
        );

        // ------------------------------------------------------------
        // 3. Anonymous admin access
        // ------------------------------------------------------------
        const adminAnonymous = await request(
            "/api/v1/admin/users"
        );

        check(
            "Anonymous admin access is rejected",
            adminAnonymous.status === 401
        );

        // ------------------------------------------------------------
        // 4. Missing bearer token
        // ------------------------------------------------------------
        const missingBearer = await request(
            "/api/v1/users"
        );

        check(
            "Protected endpoint rejects missing authentication",
            missingBearer.status === 401
        );

        // ------------------------------------------------------------
        // 5. Malformed authorization headers
        // ------------------------------------------------------------
        const malformedHeaders = [
            "Basic abc",
            "Bearer",
            "Bearer abc def",
            "bearer abc def",
            "Bearer    abc    def"
        ];

        for (const header of malformedHeaders) {
            const response = await request(
                "/api/v1/users",
                {
                    headers: {
                        Authorization: header
                    }
                }
            );

            check(
                `Malformed Authorization rejected: ${JSON.stringify(header)}`,
                response.status === 401
            );
        }

        // ------------------------------------------------------------
        // 6. Invalid bearer token
        // ------------------------------------------------------------
        const invalidToken = await request(
            "/api/v1/users",
            {
                headers: {
                    Authorization: "Bearer definitely-invalid-token"
                }
            }
        );

        check(
            "Invalid bearer token is rejected",
            invalidToken.status === 401
        );

        // ------------------------------------------------------------
        // 7. API-key endpoint must not accept bearer authentication
        // ------------------------------------------------------------
        const apiKeyWithBearer = await request(
            "/api/v1/developer/identity",
            {
                headers: {
                    Authorization: "Bearer definitely-invalid-token"
                }
            }
        );

        check(
            "API-key endpoint rejects bearer-only authentication",
            apiKeyWithBearer.status === 401
        );

        // ------------------------------------------------------------
        // 8. API-key endpoint without key
        // ------------------------------------------------------------
        const missingApiKey = await request(
            "/api/v1/developer/identity"
        );

        check(
            "API-key endpoint rejects missing API key",
            missingApiKey.status === 401
        );

        // ------------------------------------------------------------
        // 9. Invalid API key
        // ------------------------------------------------------------
        const invalidApiKey = await request(
            "/api/v1/developer/identity",
            {
                headers: {
                    "X-API-Key": "cdm_definitely-invalid"
                }
            }
        );

        check(
            "Invalid API key is rejected",
            invalidApiKey.status === 401
        );

        // ------------------------------------------------------------
        // 10. Sensitive response leakage
        // ------------------------------------------------------------
        const health = await request(
            "/api/v1/health"
        );

        const healthText = await health.text();

        check(
            "Health response does not expose password hashes",
            !healthText.toLowerCase().includes("password_hash")
        );

        check(
            "Health response does not expose API-key hashes",
            !healthText.toLowerCase().includes("key_hash")
        );

        // ------------------------------------------------------------
        // 11. Unknown route
        // ------------------------------------------------------------
        const unknown = await request(
            "/api/v1/security-this-route-does-not-exist"
        );

        check(
            "Unknown API route returns 404",
            unknown.status === 404
        );

        // ------------------------------------------------------------
        // 12. Unsupported method
        // ------------------------------------------------------------
        const methodProbe = await request(
            "/api/v1/health",
            {
                method: "DELETE"
            }
        );

        check(
            "Unsupported method does not return success",
            methodProbe.status >= 400
        );

        console.log("\n============================================================");
        console.log("CODEM PHASE 3D SECURITY BASELINE");
        console.log("============================================================");
        console.log(`PASS: ${pass}`);
        console.log(`FAIL: ${fail}`);

        if (fail === 0) {
            console.log(
                "STATUS: BASELINE SECURITY TEST PASSED"
            );
        } else {
            console.log(
                "STATUS: BASELINE SECURITY ISSUES DETECTED"
            );
        }

        console.log("============================================================");

    } catch (error) {
        console.error("BASELINE TEST ERROR:", error);
        process.exitCode = 1;
    } finally {
        server.close();
    }
});
