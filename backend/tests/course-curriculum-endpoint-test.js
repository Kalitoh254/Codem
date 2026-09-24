import assert from "node:assert/strict";
import crypto from "node:crypto";

import db from "../src/database/db.js";
import app from "../src/app.js";

const courseId = crypto.randomUUID();
const moduleOneId = crypto.randomUUID();
const moduleTwoId = crypto.randomUUID();

const lessonOneId = crypto.randomUUID();
const lessonTwoId = crypto.randomUUID();
const lessonThreeId = crypto.randomUUID();

const slug = `curriculum-endpoint-${courseId}`;

function insertTestData() {
    db.prepare(`
        INSERT INTO courses (
            id,
            title,
            slug,
            description,
            difficulty,
            status,
            category,
            duration_minutes,
            prerequisites,
            learning_outcomes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        courseId,
        "Curriculum Endpoint Course",
        slug,
        "Testing nested curriculum.",
        "beginner",
        "published",
        "Web Development",
        180,
        JSON.stringify([
            "Basic computer knowledge"
        ]),
        JSON.stringify([
            "Build a web application",
            "Understand HTTP APIs"
        ])
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
        moduleOneId,
        courseId,
        "Foundations",
        "foundations",
        "Course foundations.",
        1,
        "published"
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
        moduleTwoId,
        courseId,
        "HTTP Development",
        "http-development",
        "Working with HTTP.",
        2,
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
        lessonOneId,
        courseId,
        moduleOneId,
        "Introduction",
        "introduction",
        "Introduction lesson.",
        "Introduction content.",
        1,
        "reading",
        1,
        10
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
        lessonTwoId,
        courseId,
        moduleOneId,
        "First Exercise",
        "first-exercise",
        "Exercise lesson.",
        "Exercise content.",
        2,
        "exercise",
        1,
        20
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
        lessonThreeId,
        courseId,
        moduleTwoId,
        "HTTP Basics",
        "http-basics",
        "HTTP lesson.",
        "HTTP content.",
        1,
        "code",
        0,
        30
    );
}

async function request(path) {
    const server = await new Promise((resolve, reject) => {
        const instance = app.listen(
            0,
            "127.0.0.1",
            () => resolve(instance)
        );

        instance.on("error", reject);
    });

    try {
        const { port } = server.address();

        const response = await fetch(
            `http://127.0.0.1:${port}/api/v1${path}`
        );

        const data = await response.json();

        return {
            status: response.status,
            data
        };
    } finally {
        await new Promise(resolve =>
            server.close(resolve)
        );
    }
}

try {
    console.log("===== CURRICULUM ENDPOINT TEST =====");

    insertTestData();

    console.log("1. Request nested curriculum");

    const response = await request(
        `/courses/${courseId}/curriculum`
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.success, true);

    console.log("   PASS");

    const curriculum = response.data.data;

    console.log("2. Verify course metadata");

    assert.equal(curriculum.id, courseId);
    assert.equal(
        curriculum.title,
        "Curriculum Endpoint Course"
    );
    assert.equal(
        curriculum.category,
        "Web Development"
    );
    assert.equal(
        curriculum.durationMinutes,
        180
    );

    assert.deepEqual(
        curriculum.prerequisites,
        ["Basic computer knowledge"]
    );

    assert.deepEqual(
        curriculum.learningOutcomes,
        [
            "Build a web application",
            "Understand HTTP APIs"
        ]
    );

    console.log("   PASS");

    console.log("3. Verify curriculum statistics");

    assert.deepEqual(
        curriculum.statistics,
        {
            moduleCount: 2,
            lessonCount: 3,
            requiredLessonCount: 2,
            estimatedMinutes: 60
        }
    );

    console.log("   PASS");

    console.log("4. Verify module hierarchy");

    assert.equal(curriculum.modules.length, 2);

    assert.equal(
        curriculum.modules[0].id,
        moduleOneId
    );

    assert.equal(
        curriculum.modules[0].title,
        "Foundations"
    );

    assert.equal(
        curriculum.modules[1].id,
        moduleTwoId
    );

    assert.equal(
        curriculum.modules[1].title,
        "HTTP Development"
    );

    console.log("   PASS");

    console.log("5. Verify lessons nested under modules");

    assert.equal(
        curriculum.modules[0].lessons.length,
        2
    );

    assert.equal(
        curriculum.modules[1].lessons.length,
        1
    );

    assert.equal(
        curriculum.modules[0].lessons[0].id,
        lessonOneId
    );

    assert.equal(
        curriculum.modules[0].lessons[1].id,
        lessonTwoId
    );

    assert.equal(
        curriculum.modules[1].lessons[0].id,
        lessonThreeId
    );

    console.log("   PASS");

    console.log("6. Verify lesson metadata");

    assert.equal(
        curriculum.modules[0].lessons[0].lessonType,
        "reading"
    );

    assert.equal(
        curriculum.modules[0].lessons[0].isRequired,
        true
    );

    assert.equal(
        curriculum.modules[0].lessons[0].estimatedMinutes,
        10
    );

    assert.equal(
        curriculum.modules[0].lessons[1].lessonType,
        "exercise"
    );

    assert.equal(
        curriculum.modules[1].lessons[0].lessonType,
        "code"
    );

    assert.equal(
        curriculum.modules[1].lessons[0].isRequired,
        false
    );

    console.log("   PASS");

    console.log("7. Verify ordering");

    assert.equal(
        curriculum.modules[0].position,
        1
    );

    assert.equal(
        curriculum.modules[1].position,
        2
    );

    assert.equal(
        curriculum.modules[0].lessons[0].position,
        1
    );

    assert.equal(
        curriculum.modules[0].lessons[1].position,
        2
    );

    console.log("   PASS");

    console.log("8. Missing curriculum returns 404");

    const missing = await request(
        `/courses/${crypto.randomUUID()}/curriculum`
    );

    assert.equal(missing.status, 404);
    assert.equal(
        missing.data.success,
        false
    );

    console.log("   PASS");

    console.log("");
    console.log(
        "===== CURRICULUM ENDPOINT TESTS PASSED ====="
    );
} finally {
    db.prepare(`
        DELETE FROM courses
        WHERE id = ?
    `).run(courseId);
}
