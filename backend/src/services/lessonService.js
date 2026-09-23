import crypto from "node:crypto";
import db from "../database/db.js";
import {
    listLessons,
    findLessonById,
    createLesson,
    updateLesson,
    deleteLesson
} from "../repositories/lessonRepository.js";

function assertCourse(courseId) {
    const course = db.prepare(
        "SELECT id FROM courses WHERE id = ?"
    ).get(courseId);

    if (!course) {
        throw Object.assign(
            new Error("Course not found."),
            { status: 404, code: "COURSE_NOT_FOUND" }
        );
    }
}

export function getLessons(courseId) {
    assertCourse(courseId);
    return listLessons(courseId);
}

export function getLesson(id) {
    const lesson = findLessonById(id);

    if (!lesson) {
        throw Object.assign(
            new Error("Lesson not found."),
            { status: 404, code: "LESSON_NOT_FOUND" }
        );
    }

    return lesson;
}

export function createNewLesson(courseId, data) {
    assertCourse(courseId);

    if (!data.title?.trim()) {
        throw Object.assign(
            new Error("Lesson title is required."),
            { status: 400, code: "LESSON_TITLE_REQUIRED" }
        );
    }

    return createLesson({
        id: crypto.randomUUID(),
        courseId,
        title: data.title.trim(),
        content: data.content || "",
        position: Number.isInteger(data.position)
            ? data.position
            : listLessons(courseId).length + 1
    });
}

export function editLesson(id, data) {
    getLesson(id);

    return updateLesson(id, {
        ...(data.title !== undefined
            ? { title: data.title.trim() }
            : {}),
        ...(data.content !== undefined
            ? { content: data.content }
            : {}),
        ...(data.position !== undefined
            ? { position: Number(data.position) }
            : {})
    });
}

export function removeLesson(id) {
    getLesson(id);
    deleteLesson(id);
    return { deleted: true };
}
