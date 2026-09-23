import * as certificateService
    from "../services/certificateService.js";

export function issueCertificateController(req, res, next) {
    try {
        const certificate =
            certificateService.issueCertificate(
                req.user.id,
                req.params.courseId
            );

        res.status(201).json({
            success: true,
            data: certificate
        });
    } catch (error) {
        next(error);
    }
}

export function getCertificateController(req, res, next) {
    try {
        const certificate =
            certificateService.getCertificate(
                req.user.id,
                req.params.certificateId
            );

        res.json({
            success: true,
            data: certificate
        });
    } catch (error) {
        next(error);
    }
}

export function getCourseCertificateController(
    req,
    res,
    next
) {
    try {
        const certificate =
            certificateService.getCourseCertificate(
                req.user.id,
                req.params.courseId
            );

        res.json({
            success: true,
            data: certificate
        });
    } catch (error) {
        next(error);
    }
}

export function listCertificatesController(req, res, next) {
    try {
        const certificates =
            certificateService.listUserCertificates(
                req.user.id
            );

        res.json({
            success: true,
            data: certificates
        });
    } catch (error) {
        next(error);
    }
}

export function verifyCertificateController(req, res, next) {
    try {
        const result =
            certificateService.verifyCertificate(
                req.params.verificationCode
            );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
