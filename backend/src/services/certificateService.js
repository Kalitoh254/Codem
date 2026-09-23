import crypto from "node:crypto";

import db from "../database/db.js";

import {
    createCertificate,
    findCertificateById,
    findCertificateByUserAndCourse,
    findCertificateByVerificationCode,
    listCertificatesByUser
} from "../repositories/certificateRepository.js";

function serviceError(message, status, code) {
    return Object.assign(
        new Error(message),
        { status, code }
    );
}

function generateCertificateNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto
        .randomBytes(6)
        .toString("hex")
        .toUpperCase();

    return `CODEM-${timestamp}-${random}`;
}

function generateVerificationCode() {
    return crypto.randomBytes(24).toString("hex");
}

function getCompletedCourseState(userId, courseId) {
    const course = db.prepare(`
        SELECT
            id,
            title,
            slug,
            status
        FROM courses
        WHERE id = ?
    `).get(courseId);

    if (!course) {
        throw serviceError(
            "Course not found.",
            404,
            "COURSE_NOT_FOUND"
        );
    }

    const enrollment = db.prepare(`
        SELECT
            id,
            user_id,
            course_id,
            status,
            enrolled_at,
            completed_at
        FROM enrollments
        WHERE user_id = ?
          AND course_id = ?
    `).get(userId, courseId);

    if (!enrollment) {
        throw serviceError(
            "You are not enrolled in this course.",
            403,
            "COURSE_NOT_ENROLLED"
        );
    }

    if (enrollment.status === "cancelled") {
        throw serviceError(
            "This course enrollment has been cancelled.",
            403,
            "COURSE_ENROLLMENT_CANCELLED"
        );
    }

    const totalLessons = db.prepare(`
        SELECT COUNT(*) AS count
        FROM lessons
        WHERE course_id = ?
    `).get(courseId).count;

    const completedLessons = db.prepare(`
        SELECT COUNT(*) AS count
        FROM lesson_progress lp
        JOIN lessons l
            ON l.id = lp.lesson_id
        WHERE lp.user_id = ?
          AND l.course_id = ?
          AND lp.status = 'completed'
          AND lp.progress_percent = 100
    `).get(userId, courseId).count;

    if (totalLessons === 0) {
        throw serviceError(
            "This course has no lessons and cannot issue a certificate.",
            409,
            "COURSE_HAS_NO_LESSONS"
        );
    }

    if (completedLessons !== totalLessons) {
        throw serviceError(
            "All course lessons must be completed before a certificate can be issued.",
            409,
            "COURSE_NOT_COMPLETED"
        );
    }

    return {
        course,
        enrollment,
        totalLessons,
        completedLessons
    };
}

function buildCertificateResponse(certificate) {
    if (!certificate) {
        return null;
    }

    return {
        id: certificate.id,
        userId: certificate.user_id,
        courseId: certificate.course_id,
        certificateNumber: certificate.certificate_number,
        verificationCode: certificate.verification_code,
        issuedAt: certificate.issued_at
    };
}

export function issueCertificate(userId, courseId) {
    const existing = findCertificateByUserAndCourse(
        userId,
        courseId
    );

    if (existing) {
        return buildCertificateResponse(existing);
    }

    getCompletedCourseState(userId, courseId);

    const certificateId = crypto.randomUUID();

    const certificate = createCertificate({
        id: certificateId,
        userId,
        courseId,
        certificateNumber: generateCertificateNumber(),
        verificationCode: generateVerificationCode()
    });

    return buildCertificateResponse(certificate);
}

export function getCertificate(userId, certificateId) {
    const certificate = findCertificateById(certificateId);

    if (!certificate) {
        throw serviceError(
            "Certificate not found.",
            404,
            "CERTIFICATE_NOT_FOUND"
        );
    }

    if (certificate.user_id !== userId) {
        throw serviceError(
            "You do not have access to this certificate.",
            403,
            "CERTIFICATE_ACCESS_DENIED"
        );
    }

    return buildCertificateResponse(certificate);
}

export function getCourseCertificate(userId, courseId) {
    const certificate = findCertificateByUserAndCourse(
        userId,
        courseId
    );

    return buildCertificateResponse(certificate);
}

export function listUserCertificates(userId) {
    return listCertificatesByUser(userId)
        .map(buildCertificateResponse);
}

export function verifyCertificate(verificationCode) {
    const normalizedCode = String(
        verificationCode ?? ""
    ).trim();

    if (!normalizedCode) {
        throw serviceError(
            "Verification code is required.",
            400,
            "VERIFICATION_CODE_REQUIRED"
        );
    }

    const certificate =
        findCertificateByVerificationCode(normalizedCode);

    if (!certificate) {
        throw serviceError(
            "Certificate could not be verified.",
            404,
            "CERTIFICATE_NOT_FOUND"
        );
    }

    const details = db.prepare(`
        SELECT
            c.id,
            c.certificate_number,
            c.issued_at,
            co.id AS course_id,
            co.title AS course_title,
            co.slug AS course_slug,
            u.id AS user_id,
            u.username,
            p.display_name
        FROM certificates c
        JOIN courses co
            ON co.id = c.course_id
        JOIN users u
            ON u.id = c.user_id
        LEFT JOIN profiles p
            ON p.user_id = u.id
        WHERE c.id = ?
    `).get(certificate.id);

    return {
        valid: true,
        certificate: {
            id: details.id,
            certificateNumber: details.certificate_number,
            issuedAt: details.issued_at
        },
        recipient: {
            userId: details.user_id,
            username: details.username,
            displayName: details.display_name
        },
        course: {
            id: details.course_id,
            title: details.course_title,
            slug: details.course_slug
        }
    };
}
