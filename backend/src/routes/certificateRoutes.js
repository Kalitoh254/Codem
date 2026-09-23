import express from "express";

import { requireAuth } from "../middleware/auth.js";

import {
    issueCertificateController,
    getCertificateController,
    getCourseCertificateController,
    listCertificatesController,
    verifyCertificateController
} from "../controllers/certificateController.js";

const router = express.Router();

/*
 * Public certificate verification.
 *
 * This route must appear before authenticated
 * parameterized certificate routes.
 */
router.get(
    "/verify/:verificationCode",
    verifyCertificateController
);

/*
 * Authenticated certificate operations.
 */
router.use(requireAuth);

router.get(
    "/",
    listCertificatesController
);

router.get(
    "/course/:courseId",
    getCourseCertificateController
);

router.post(
    "/course/:courseId/issue",
    issueCertificateController
);

router.get(
    "/:certificateId",
    getCertificateController
);

export default router;
