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
            console.log(
                `FAIL: ${name}${detail ? ` - ${detail}` : ""}`
            );
        }
    }

    async function request(path, options = {}) {
        return fetch(`${base}${path}`, options);
    }

    try {
        // ============================================================
        // SECURITY HEADERS
        // ============================================================

        const root = await request("/");

        check(
            "X-Powered-By header is disabled",
            !root.headers.get("x-powered-by")
        );

        check(
            "Helmet security headers are present",
            Boolean(root.headers.get("x-content-type-options")) &&
            Boolean(root.headers.get("content-security-policy"))
        );

        // ============================================================
        // CORS
        // ============================================================

        const forbiddenOrigin = await request("/", {
            headers: {
                Origin: "https://evil.example"
            }
        });

        check(
            "Unconfigured CORS origin is rejected",
            forbiddenOrigin.status === 403
        );

        check(
            "Rejected CORS origin is not reflected",
            forbiddenOrigin.headers.get(
                "access-control-allow-origin"
            ) === null
        );

        const noOrigin = await request("/");

        check(
            "Requests without an Origin header remain functional",
            noOrigin.status === 200
        );

        // ============================================================
        // AUTHENTICATION
        // ============================================================

        const anonymousAdmin = await request(
            "/api/v1/admin/users"
        );

        check(
            "Anonymous admin access is rejected",
            anonymousAdmin.status === 401
        );

        const protectedAnonymous = await request(
            "/api/v1/users"
        );

        check(
            "Protected endpoint rejects missing authentication",
            protectedAnonymous.status === 401
        );

        const malformedAuthorization = [
            "Basic abc",
            "Bearer",
            "Bearer abc def",
            "bearer abc def",
            "Bearer    abc    def",
            "Bearer\tabc\tdef",
            "Bearer abc extra"
        ];

        for (const header of malformedAuthorization) {
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

        const invalidBearer = await request(
            "/api/v1/users",
            {
                headers: {
                    Authorization:
                        "Bearer definitely-invalid-token"
                }
            }
        );

        check(
            "Invalid bearer token is rejected",
            invalidBearer.status === 401
        );

        // ============================================================
        // API KEY AUTHENTICATION
        // ============================================================

        const bearerAgainstApiKey = await request(
            "/api/v1/developer/identity",
            {
                headers: {
                    Authorization:
                        "Bearer definitely-invalid-token"
                }
            }
        );

        check(
            "Bearer token cannot authenticate API-key endpoint",
            bearerAgainstApiKey.status === 401
        );

        const missingApiKey = await request(
            "/api/v1/developer/identity"
        );

        check(
            "Missing API key is rejected",
            missingApiKey.status === 401
        );

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

        // ============================================================
        // INPUT HANDLING
        // ============================================================

        const malformedJson = await request(
            "/api/v1/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: '{"email":'
            }
        );

        check(
            "Malformed JSON is rejected",
            malformedJson.status >= 400 &&
            malformedJson.status < 500
        );

        // ============================================================
        // BODY SIZE LIMIT
        // ============================================================

        const oversizedPayload = JSON.stringify({
            email: "test@example.com",
            password: "A".repeat(1_100_000)
        });

        const oversized = await request(
            "/api/v1/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: oversizedPayload
            }
        );

        check(
            "Oversized JSON body is rejected",
            oversized.status === 413
        );

        // ============================================================
        // RESPONSE LEAKAGE
        // ============================================================

        const health = await request(
            "/api/v1/health"
        );

        const healthText = await health.text();

        check(
            "Health response does not expose password hashes",
            !healthText
                .toLowerCase()
                .includes("password_hash")
        );

        check(
            "Health response does not expose API-key hashes",
            !healthText
                .toLowerCase()
                .includes("key_hash")
        );

        check(
            "Health response does not expose bearer tokens",
            !healthText
                .toLowerCase()
                .includes("access_token")
        );

        // ============================================================
        // ROUTING / METHOD CONFUSION
        // ============================================================

        const unknownRoute = await request(
            "/api/v1/security-this-route-does-not-exist"
        );

        check(
            "Unknown API route returns 404",
            unknownRoute.status === 404
        );

        const deleteHealth = await request(
            "/api/v1/health",
            {
                method: "DELETE"
            }
        );

        check(
            "Unsupported method does not return success",
            deleteHealth.status >= 400
        );

        // ============================================================
        // RATE LIMITING
        // ============================================================

        let rateLimitHit = false;

        for (let i = 0; i < 25; i++) {
            const response = await request(
                "/api/v1/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: "ratelimit-test@example.com",
                        password: "wrong-password"
                    })
                }
            );

            if (response.status === 429) {
                rateLimitHit = true;
                break;
            }
        }

        check(
            "Authentication rate limit is enforced",
            rateLimitHit
        );

        console.log("\n============================================================");
        console.log("CODEM PHASE 3D SECURITY HARDENING");
        console.log("============================================================");
        console.log(`PASS: ${pass}`);
        console.log(`FAIL: ${fail}`);

        if (fail === 0) {
            console.log(
                "STATUS: CODEM PHASE 3D SECURITY HARDENING PASSED"
            );
        } else {
            console.log(
                "STATUS: CODEM PHASE 3D SECURITY HARDENING NEEDS FIXES"
            );
        }

        console.log("============================================================");

        process.exitCode = fail === 0 ? 0 : 1;

    } catch (error) {
        console.error("SECURITY TEST ERROR:", error);
        process.exitCode = 1;
    } finally {
        server.close();
    }
});
