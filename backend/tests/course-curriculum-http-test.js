import assert from "node:assert/strict";
import crypto from "node:crypto";

import db from "../src/database/db.js";
import app from "../src/app.js";

const BASE = "/api/v1";

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const server = app.listen(0, "127.0.0.1", async () => {
            const { port } = server.address();

            try {
                const response = await fetch(
                    `http://127.0.0.1:${port}${BASE}${path}`,
                    {
                        method,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body:
                            body === undefined
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

                server.close();

                resolve({
                    status: response.status,
                    data
                });
            } catch (error) {
                server.close();
                reject(error);
            }
        });
    });
}

const courseId = crypto.randomUUID();
const moduleId = crypto.randomUUID();
const lessonId = crypto.randomUUID();

try {
    console.log("===== COURSE CURRICULUM HTTP TEST =====");

    /*
     * Seed a course directly so this test can focus on
     * the public HTTP curriculum endpoints without
     * bypassing admin authentication.
     */
    db.prepare(`
        INSERT INTO courses (
            id,
            title,
            slug,
            description,
            difficulty,
            status,
            category
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        courseId,
        "HTTP Integration Course",
        `http-integration-${courseId}`,
        "Course HTTP integration test.",
        "beginner",
        "published",
        "Web Development"
    );

    db.prepare(`
        INSERT INTO course_modules (
            id,
            course_id,
            title,
            slug,
            description,
            position,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        moduleId,
        courseId,
        "Module One",
        "module-one",
        "First module.",
        1,
        "published"
    );

    db.prepare(`
        INSERT INTO lessons (
            id,
            course_id,
            module_id,
            title,
            slug,
            description,
            content,
            position,
            lesson_type,
            is_required,
            estimated_minutes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        lessonId,
        courseId,
        moduleId,
        "Lesson One",
        "lesson-one",
        "First lesson.",
        "Lesson content.",
        1,
        "reading",
        1,
        15
    );

    console.log("1. GET course");

    const courseResponse = await request(
        "GET",
        `/courses/${courseId}`
    );

    assert.equal(courseResponse.status, 200);
    assert.equal(courseResponse.data.success, true);
    assert.equal(
        courseResponse.data.data.id,
        courseId
    );

    console.log("   PASS");

    console.log("2. GET course modules");

    const moduleResponse = await request(
        "GET",
        `/modules/course/${courseId}`
    );

    assert.equal(moduleResponse.status, 200);
    assert.equal(moduleResponse.data.success, true);
    assert.equal(
        moduleResponse.data.data.length,
        1
    );
    assert.equal(
        moduleResponse.data.data[0].id,
        moduleId
    );

    console.log("   PASS");

    console.log("3. GET module");

    const singleModuleResponse = await request(
        "GET",
        `/modules/${moduleId}`
    );

    assert.equal(
        singleModuleResponse.status,
        200
    );
    assert.equal(
        singleModuleResponse.data.data.id,
        moduleId
    );

    console.log("   PASS");

    console.log("4. GET course lessons");

    const lessonResponse = await request(
        "GET",
        `/lessons/course/${courseId}`
    );

    assert.equal(lessonResponse.status, 200);
    assert.equal(
        lessonResponse.data.success,
        true
    );
    assert.equal(
        lessonResponse.data.data.length,
        1
    );
    assert.equal(
        lessonResponse.data.data[0].id,
        lessonId
    );

    console.log("   PASS");

    console.log("5. GET module lessons");

    const moduleLessonResponse = await request(
        "GET",
        `/lessons/module/${moduleId}`
    );

    assert.equal(
        moduleLessonResponse.status,
        200
    );
    assert.equal(
        moduleLessonResponse.data.success,
        true
    );
    assert.equal(
        moduleLessonResponse.data.data.length,
        1
    );
    assert.equal(
        moduleLessonResponse.data.data[0].id,
        lessonId
    );

    console.log("   PASS");

    console.log("6. GET individual lesson");

    const singleLessonResponse = await request(
        "GET",
        `/lessons/${lessonId}`
    );

    assert.equal(
        singleLessonResponse.status,
        200
    );
    assert.equal(
        singleLessonResponse.data.data.id,
        lessonId
    );
    assert.equal(
        singleLessonResponse.data.data.lesson_type,
        "reading"
    );
    assert.equal(
        singleLessonResponse.data.data.is_required,
        1
    );
    assert.equal(
        singleLessonResponse.data.data.estimated_minutes,
        15
    );

    console.log("   PASS");

    console.log("7. Missing course returns 404");

    const missingCourseResponse = await request(
        "GET",
        `/courses/${crypto.randomUUID()}`
    );

    assert.equal(
        missingCourseResponse.status,
        404
    );

    console.log("   PASS");

    console.log("8. Missing module returns 404");

    const missingModuleResponse = await request(
        "GET",
        `/modules/${crypto.randomUUID()}`
    );

    assert.equal(
        missingModuleResponse.status,
        404
    );

    console.log("   PASS");

    console.log("9. Missing lesson returns 404");

    const missingLessonResponse = await request(
        "GET",
        `/lessons/${crypto.randomUUID()}`
    );

    assert.equal(
        missingLessonResponse.status,
        404
    );

    console.log("   PASS");

    console.log("");
    console.log(
        "===== COURSE CURRICULUM HTTP TESTS PASSED ====="
    );
} finally {
    db.prepare(`
        DELETE FROM courses
        WHERE id = ?
    `).run(courseId);
}
