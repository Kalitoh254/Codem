import assert from "node:assert/strict";
import crypto from "node:crypto";

import db from "../src/database/db.js";
import {
    createNewModule,
    getModules,
    getModule,
    editModule,
    removeModule
} from "../src/services/moduleService.js";

const courseId = crypto.randomUUID();
const moduleId = crypto.randomUUID();

db.prepare(`
    INSERT INTO courses (
        id,
        title,
        slug,
        description,
        difficulty,
        status
    )
    VALUES (?, ?, ?, ?, ?, ?)
`).run(
    courseId,
    "Module API Test Course",
    `module-api-test-${courseId}`,
    "Temporary test course",
    "beginner",
    "draft"
);

try {
    console.log("===== CREATE MODULE =====");

    const created = createNewModule(courseId, {
        title: "Introduction to Web Development",
        description: "Test module",
        position: 1
    });

    assert.equal(created.course_id, courseId);
    assert.equal(created.title, "Introduction to Web Development");
    assert.equal(created.slug, "introduction-to-web-development");
    assert.equal(created.position, 1);
    assert.equal(created.status, "draft");

    const createdModuleId = created.id;

    console.log("CREATE MODULE: PASS");

    console.log("===== LIST MODULES =====");

    const modules = getModules(courseId);

    assert.equal(modules.length, 1);
    assert.equal(modules[0].id, createdModuleId);

    console.log("LIST MODULES: PASS");

    console.log("===== GET MODULE =====");

    const found = getModule(createdModuleId);

    assert.equal(found.id, createdModuleId);
    assert.equal(found.course_id, courseId);

    console.log("GET MODULE: PASS");

    console.log("===== DUPLICATE SLUG CHECK =====");

    assert.throws(
        () => createNewModule(courseId, {
            title: "Introduction to Web Development"
        }),
        error => error.code === "MODULE_SLUG_EXISTS"
    );

    console.log("DUPLICATE SLUG: PASS");

    console.log("===== INVALID STATUS CHECK =====");

    assert.throws(
        () => createNewModule(courseId, {
            title: "Invalid Status Module",
            status: "invalid"
        }),
        error => error.code === "INVALID_MODULE_STATUS"
    );

    console.log("INVALID STATUS: PASS");

    console.log("===== UPDATE MODULE =====");

    const updated = editModule(createdModuleId, {
        title: "Web Development Fundamentals",
        description: "Updated module description",
        position: 2,
        status: "published"
    });

    assert.equal(updated.title, "Web Development Fundamentals");
    assert.equal(updated.description, "Updated module description");
    assert.equal(updated.position, 2);
    assert.equal(updated.status, "published");

    console.log("UPDATE MODULE: PASS");

    console.log("===== DELETE MODULE =====");

    const deleted = removeModule(createdModuleId);

    assert.equal(deleted.deleted, true);
    assert.equal(
        db.prepare(`
            SELECT id
            FROM course_modules
            WHERE id = ?
        `).get(createdModuleId),
        undefined
    );

    console.log("DELETE MODULE: PASS");

    console.log("===== MISSING COURSE CHECK =====");

    assert.throws(
        () => getModules("missing-course-id"),
        error => error.code === "COURSE_NOT_FOUND"
    );

    console.log("MISSING COURSE: PASS");

    console.log();
    console.log("===== MODULE API TESTS PASSED =====");
} finally {
    db.prepare(`
        DELETE FROM courses
        WHERE id = ?
    `).run(courseId);
}
