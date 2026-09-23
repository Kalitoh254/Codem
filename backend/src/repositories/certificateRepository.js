import db from "../database/db.js";

export function createCertificate({
    id,
    userId,
    courseId,
    certificateNumber,
    verificationCode
}) {
    db.prepare(`
        INSERT INTO certificates (
            id,
            user_id,
            course_id,
            certificate_number,
            verification_code
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(
        id,
        userId,
        courseId,
        certificateNumber,
        verificationCode
    );

    return findCertificateById(id);
}

export function findCertificateById(id) {
    return db.prepare(`
        SELECT
            c.id,
            c.user_id,
            c.course_id,
            c.certificate_number,
            c.verification_code,
            c.issued_at
        FROM certificates c
        WHERE c.id = ?
    `).get(id) || null;
}

export function findCertificateByUserAndCourse(userId, courseId) {
    return db.prepare(`
        SELECT
            c.id,
            c.user_id,
            c.course_id,
            c.certificate_number,
            c.verification_code,
            c.issued_at
        FROM certificates c
        WHERE c.user_id = ?
          AND c.course_id = ?
    `).get(userId, courseId) || null;
}

export function findCertificateByVerificationCode(
    verificationCode
) {
    return db.prepare(`
        SELECT
            c.id,
            c.user_id,
            c.course_id,
            c.certificate_number,
            c.verification_code,
            c.issued_at
        FROM certificates c
        WHERE c.verification_code = ?
    `).get(verificationCode) || null;
}

export function listCertificatesByUser(userId) {
    return db.prepare(`
        SELECT
            c.id,
            c.user_id,
            c.course_id,
            c.certificate_number,
            c.verification_code,
            c.issued_at
        FROM certificates c
        WHERE c.user_id = ?
        ORDER BY c.issued_at DESC
    `).all(userId);
}
