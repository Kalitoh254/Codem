import crypto from "node:crypto";
import { spawn } from "node:child_process";
import db from "../src/database/db.js";

const BASE_URL = "http://127.0.0.1:5000/api/v1";

const userId = crypto.randomUUID();
const courseId = crypto.randomUUID();
const lesson1Id = crypto.randomUUID();
const lesson2Id = crypto.randomUUID();

let server;
let token;

function assert(condition, message) {
    if (!condition) {
        throw new Error(`FAIL: ${message}`);
    }

    console.log(`PASS: ${message}`);
}

async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            ...(options.headers || {})
        }
    });

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
                `${BASE_URL}/health`
            );

            if (response.ok) {
                return;
            }
        } catch {}

        await new Promise(resolve =>
            setTimeout(resolve, 250)
        );
    }

    throw new Error("Backend did not start.");
}

try {
    console.log("============================================================");
    console.log("CODEM LEARNING API INTEGRATION TEST");
    console.log("============================================================");

    console.log("[1/8] Starting backend...");

    server = spawn(
        process.execPath,
        ["src/server.js"],
        {
            cwd: new URL("..", import.meta.url).pathname,
            stdio: "ignore"
        }
    );

    await waitForServer();

    console.log("PASS: Backend started");

    console.log("[2/8] Creating test data...");

    const email =
        `learning-api-${userId}@test.local`;

    const username =
        `learning_api_${userId.slice(0, 8)}`;

    db.prepare(`
        INSERT INTO users (
            id,
            email,
            username,
            password_hash,
            role,
            status
        )
        VALUES (?, ?, ?, ?, 'user', 'active')
    `).run(
        userId,
        email,
        username,
        "test-hash"
    );

    db.prepare(`
        INSERT INTO courses (
            id,
            title,
            slug,
            description,
            difficulty,
            status
        )
        VALUES (?, ?, ?, ?, 'beginner', 'published')
    `).run(
        courseId,
        "Learning API Test",
        `learning-api-${userId.slice(0, 8)}`,
        "Temporary API test course"
    );

    db.prepare(`
        INSERT INTO lessons (
            id,
            course_id,
            title,
            slug,
            content,
            position
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        lesson1Id,
        courseId,
        "API Lesson One",
        "api-lesson-one",
        "Temporary lesson",
        1
    );

    db.prepare(`
        INSERT INTO lessons (
            id,
            course_id,
            title,
            slug,
            content,
            position
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        lesson2Id,
        courseId,
        "API Lesson Two",
        "api-lesson-two",
        "Temporary lesson",
        2
    );

    console.log("PASS: Test course and lessons created");

    console.log("[3/8] Authenticating test user...");

    const login = await request(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email,
                password: "test-password"
            })
        }
    );

    /*
     * The database user above contains a fake password hash,
     * so create the session directly for this integration test.
     */
    const sessionToken = crypto.randomBytes(32).toString("hex");
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
        new Date(Date.now() + 60 * 60 * 1000).toISOString()
    );

    token = sessionToken;

    console.log("PASS: Test authentication session created");

    console.log("[4/8] Testing authentication protection...");

    token = null;

    const unauthorized = await request(
        `/learning/courses/${courseId}/enrollment`
    );

    assert(
        unauthorized.status === 401,
        "Enrollment endpoint rejects unauthenticated access"
    );

    token = sessionToken;

    console.log("[5/8] Testing enrollment endpoints...");

    const enroll = await request(
        `/learning/courses/${courseId}/enroll`,
        {
            method: "POST"
        }
    );

    console.log("ENROLL STATUS:", enroll.status);
    console.log("ENROLL BODY:", JSON.stringify(enroll.body, null, 2));

    assert(
        enroll.status === 201 &&
        enroll.body?.data?.status === "active",
        "Course enrollment endpoint works"
    );

    const enrollment = await request(
        `/learning/courses/${courseId}/enrollment`
    );

    assert(
        enrollment.status === 200 &&
        enrollment.body?.data?.status === "active",
        "Enrollment retrieval endpoint works"
    );

    console.log("[6/8] Testing progress endpoints...");

    const initialProgress = await request(
        `/learning/courses/${courseId}/progress`
    );

    assert(
        initialProgress.status === 200 &&
        initialProgress.body?.data?.percentage === 0,
        "Initial course progress endpoint returns 0%"
    );

    const lessonProgress = await request(
        `/learning/lessons/${lesson1Id}/progress`,
        {
            method: "PATCH",
            body: JSON.stringify({
                completed: true
            })
        }
    );

    assert(
        lessonProgress.status === 200 &&
        lessonProgress.body?.data?.status === "completed" &&
        lessonProgress.body?.data?.progress_percent === 100,
        "Lesson progress endpoint marks lesson completed"
    );

    const updatedProgress = await request(
        `/learning/courses/${courseId}/progress`
    );

    assert(
        updatedProgress.status === 200 &&
        updatedProgress.body?.data?.completedLessons === 1 &&
        updatedProgress.body?.data?.percentage === 50,
        "Course progress endpoint reports 50%"
    );

    console.log("[7/8] Completing remaining lesson...");

    const secondLesson = await request(
        `/learning/lessons/${lesson2Id}/progress`,
        {
            method: "PATCH",
            body: JSON.stringify({
                completed: true
            })
        }
    );

    assert(
        secondLesson.status === 200 &&
        secondLesson.body?.data?.status === "completed",
        "Second lesson completed through API"
    );

    const finalProgress = await request(
        `/learning/courses/${courseId}/progress`
    );

    assert(
        finalProgress.status === 200 &&
        finalProgress.body?.data?.completedLessons === 2 &&
        finalProgress.body?.data?.percentage === 100,
        "API reports 100% course completion"
    );

    const finalEnrollment = await request(
        `/learning/courses/${courseId}/enrollment`
    );

    assert(
        finalEnrollment.status === 200 &&
        finalEnrollment.body?.data?.status === "completed" &&
        finalEnrollment.body?.data?.completed_at !== null,
        "API enrollment becomes completed"
    );

    console.log("[8/8] Final verification...");

    assert(
        finalProgress.body?.success === true,
        "Learning API responses use standard success envelope"
    );

    console.log("============================================================");
    console.log("RESULT");
    console.log("============================================================");
    console.log("PASS: LEARNING API INTEGRATION");
} finally {
    try {
        db.prepare(`
            DELETE FROM users
            WHERE id = ?
        `).run(userId);

        db.prepare(`
            DELETE FROM courses
            WHERE id = ?
        `).run(courseId);
    } catch {}

    if (server) {
        server.kill();
    }

    console.log("Temporary learning API test data removed.");
}
