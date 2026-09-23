import { spawn } from "node:child_process";
import crypto from "node:crypto";

import db from "../src/database/db.js";

const BASE_URL = "http://127.0.0.1:5000";

let server;
let token;
let userId;
let courseId;
let lesson1Id;
let lesson2Id;
let certificateId;
let verificationCode;

let passed = 0;
let failed = 0;

function pass(message) {
    passed++;
    console.log(`PASS: ${message}`);
}

function fail(message) {
    failed++;
    console.error(`FAIL: ${message}`);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }

    pass(message);
}

async function request(
    path,
    options = {}
) {
    const response = await fetch(
        `${BASE_URL}${path}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    let body = null;

    try {
        body = await response.json();
    } catch {
        body = null;
    }

    return {
        status: response.status,
        body
    };
}

async function waitForServer() {
    for (let i = 0; i < 30; i++) {
        try {
            const response = await fetch(
                `${BASE_URL}/api/v1/health`
            );

            if (response.ok) {
                return;
            }
        } catch {
            // Server is still starting.
        }

        await new Promise(resolve =>
            setTimeout(resolve, 200)
        );
    }

    throw new Error("Backend did not start.");
}

function createTestData() {
    userId = crypto.randomUUID();
    courseId = crypto.randomUUID();
    lesson1Id = crypto.randomUUID();
    lesson2Id = crypto.randomUUID();

    db.prepare(`
        INSERT INTO users (
            id,
            email,
            username,
            password_hash,
            role,
            status,
            email_verified
        )
        VALUES (?, ?, ?, ?, 'user', 'active', 1)
    `).run(
        userId,
        `certificate-test-${Date.now()}@example.com`,
        `certificate_test_${Date.now()}`,
        "test-password-hash"
    );

    db.prepare(`
        INSERT INTO courses (
            id,
            title,
            slug,
            description,
            difficulty,
            status,
            created_by
        )
        VALUES (?, ?, ?, ?, 'beginner', 'published', ?)
    `).run(
        courseId,
        "Certificate Integration Course",
        `certificate-test-${Date.now()}`,
        "Temporary course for certificate API testing.",
        userId
    );

    db.prepare(`
        INSERT INTO lessons (
            id,
            course_id,
            title,
            slug,
            description,
            content,
            position
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        lesson1Id,
        courseId,
        "Certificate Lesson One",
        "lesson-one",
        "First test lesson.",
        "Test content.",
        1
    );

    db.prepare(`
        INSERT INTO lessons (
            id,
            course_id,
            title,
            slug,
            description,
            content,
            position
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        lesson2Id,
        courseId,
        "Certificate Lesson Two",
        "lesson-two",
        "Second test lesson.",
        "Test content.",
        2
    );

    const sessionToken =
        crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
        .createHash("sha256")
        .update(sessionToken)
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
        crypto.randomUUID(),
        userId,
        tokenHash,
        new Date(
            Date.now() + 60 * 60 * 1000
        ).toISOString()
    );

    token = sessionToken;
}

function cleanup() {
    if (!userId) {
        return;
    }

    db.prepare(`
        DELETE FROM certificates
        WHERE user_id = ?
    `).run(userId);

    db.prepare(`
        DELETE FROM lesson_progress
        WHERE user_id = ?
    `).run(userId);

    db.prepare(`
        DELETE FROM enrollments
        WHERE user_id = ?
    `).run(userId);

    db.prepare(`
        DELETE FROM lessons
        WHERE course_id = ?
    `).run(courseId);

    db.prepare(`
        DELETE FROM courses
        WHERE id = ?
    `).run(courseId);

    db.prepare(`
        DELETE FROM sessions
        WHERE user_id = ?
    `).run(userId);

    db.prepare(`
        DELETE FROM users
        WHERE id = ?
    `).run(userId);
}

async function run() {
    console.log("============================================================");
    console.log("CODEM CERTIFICATE API INTEGRATION TEST");
    console.log("============================================================");

    try {
        console.log("[1/9] Starting backend...");

        server = spawn(
            process.execPath,
            ["backend/src/server.js"],
            {
                cwd: process.cwd(),
                stdio: "ignore"
            }
        );

        await waitForServer();

        pass("Backend started");

        console.log("[2/9] Creating test data...");

        createTestData();

        pass("Test user, course and lessons created");

        console.log("[3/9] Testing public verification...");

        const unauthenticatedVerification =
            await request(
                "/api/v1/certificates/verify/invalid-code"
            );

        assert(
            unauthenticatedVerification.status === 404,
            "Public certificate verification endpoint works"
        );

        console.log("[4/9] Testing unauthenticated certificate access...");

        const unauthenticatedList =
            await request(
                "/api/v1/certificates"
            );

        assert(
            unauthenticatedList.status === 401,
            "Certificate list rejects unauthenticated access"
        );

        console.log("[5/9] Enrolling test user...");

        const enrollResponse = await request(
            `/api/v1/learning/courses/${courseId}/enroll`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        assert(
            enrollResponse.status === 201,
            "Course enrollment works"
        );

        console.log("[6/9] Testing certificate protection...");

        const incompleteIssue =
            await request(
                `/api/v1/certificates/course/${courseId}/issue`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        assert(
            incompleteIssue.status === 409,
            "Certificate issuance rejects incomplete course"
        );

        assert(
            incompleteIssue.body?.error?.code ===
                "COURSE_NOT_COMPLETED",
            "Incomplete certificate rejection uses correct error code"
        );

        const noCertificate =
            await request(
                `/api/v1/certificates/course/${courseId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        assert(
            noCertificate.status === 200 &&
            noCertificate.body?.data === null,
            "Incomplete course has no certificate"
        );

        console.log("[7/9] Completing the course...");

        const firstLesson =
            await request(
                `/api/v1/learning/lessons/${lesson1Id}/progress`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        completed: true
                    })
                }
            );

        assert(
            firstLesson.status === 200,
            "First lesson completed"
        );

        const secondLesson =
            await request(
                `/api/v1/learning/lessons/${lesson2Id}/progress`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        completed: true
                    })
                }
            );

        assert(
            secondLesson.status === 200,
            "Second lesson completed"
        );

        const progress =
            await request(
                `/api/v1/learning/courses/${courseId}/progress`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        assert(
            progress.status === 200 &&
            progress.body?.data?.percentage === 100,
            "Course reaches 100% completion"
        );

        assert(
            progress.body?.data?.completedLessons === 2,
            "All course lessons are completed"
        );

        console.log("[8/9] Issuing and verifying certificate...");

        const issueResponse =
            await request(
                `/api/v1/certificates/course/${courseId}/issue`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        assert(
            issueResponse.status === 201,
            "Certificate issuance succeeds after completion"
        );

        assert(
            issueResponse.body?.success === true,
            "Certificate issuance uses standard success envelope"
        );

        assert(
            Boolean(
                issueResponse.body?.data?.certificateNumber
            ),
            "Certificate number is generated"
        );

        assert(
            Boolean(
                issueResponse.body?.data?.verificationCode
            ),
            "Verification code is generated"
        );

        certificateId =
            issueResponse.body.data.id;

        verificationCode =
            issueResponse.body.data.verificationCode;

        const duplicateIssue =
            await request(
                `/api/v1/certificates/course/${courseId}/issue`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        assert(
            duplicateIssue.status === 201,
            "Repeated issuance request is safely idempotent"
        );

        assert(
            duplicateIssue.body?.data?.id === certificateId,
            "Repeated issuance returns the existing certificate"
        );

        const courseCertificate =
            await request(
                `/api/v1/certificates/course/${courseId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        assert(
            courseCertificate.status === 200 &&
            courseCertificate.body?.data?.id === certificateId,
            "Course certificate retrieval works"
        );

        const certificate =
            await request(
                `/api/v1/certificates/${certificateId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        assert(
            certificate.status === 200 &&
            certificate.body?.data?.id === certificateId,
            "Certificate retrieval works"
        );

        const certificates =
            await request(
                "/api/v1/certificates",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        assert(
            certificates.status === 200 &&
            Array.isArray(certificates.body?.data) &&
            certificates.body.data.length === 1,
            "User certificate list works"
        );

        const verification =
            await request(
                `/api/v1/certificates/verify/${verificationCode}`
            );

        assert(
            verification.status === 200 &&
            verification.body?.data?.valid === true,
            "Public certificate verification succeeds"
        );

        assert(
            verification.body?.data?.certificate
                ?.certificateNumber ===
                issueResponse.body.data.certificateNumber,
            "Verified certificate number matches"
        );

        assert(
            verification.body?.data?.course
                ?.title ===
                "Certificate Integration Course",
            "Verified course information is returned"
        );

        console.log("[9/9] Final verification...");

        const certificateCount = db.prepare(`
            SELECT COUNT(*) AS count
            FROM certificates
            WHERE user_id = ?
              AND course_id = ?
        `).get(userId, courseId).count;

        assert(
            certificateCount === 1,
            "Database contains exactly one certificate"
        );

        console.log("============================================================");
        console.log("RESULT");
        console.log("============================================================");

        console.log(`PASS: ${passed}`);
        console.log(`FAIL: ${failed}`);

        if (failed > 0) {
            throw new Error(
                "CERTIFICATE API INTEGRATION TEST FAILED"
            );
        }

        console.log(
            "STATUS: CERTIFICATE API INTEGRATION PASSED"
        );
    } catch (error) {
        console.error("\nERROR:", error.message);
        failed++;
        process.exitCode = 1;
    } finally {
        cleanup();

        if (server) {
            server.kill("SIGTERM");
        }

        console.log(
            "Temporary certificate API test data removed."
        );
    }
}

run();
