import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";

import {
    listChallengesController,
    getChallengeController,
    createChallengeController,
    updateChallengeController,
    deleteChallengeController
} from "../controllers/challengeController.js";

const router = express.Router();

router.get("/", listChallengesController);
router.get("/:id", getChallengeController);

router.post(
    "/",
    requireAuth,
    requireRole("admin"),
    validateBody({
        title: {
            required: true,
            type: "string",
            minLength: 2,
            maxLength: 200
        },
        slug: {
            required: false,
            type: "string",
            minLength: 1,
            maxLength: 100
        },
        description: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 10000
        },
        difficulty: {
            required: false,
            type: "string",
            enum: ["beginner", "intermediate", "advanced"]
        },
        language: {
            required: false,
            type: "string",
            maxLength: 30
        },
        instructions: {
            required: false,
            type: "string",
            maxLength: 20000
        },
        starterCode: {
            required: false,
            type: "string",
            maxLength: 500000
        },
        solutionCode: {
            required: false,
            type: "string",
            maxLength: 500000
        },
        testCases: {
            required: false,
            type: "string",
            maxLength: 500000
        },
        status: {
            required: false,
            type: "string",
            enum: ["draft", "published", "archived"]
        }
    }),
    createChallengeController
);

router.patch(
    "/:id",
    requireAuth,
    requireRole("admin"),
    validateBody({
        title: {
            required: false,
            type: "string",
            minLength: 2,
            maxLength: 200
        },
        slug: {
            required: false,
            type: "string",
            minLength: 1,
            maxLength: 100
        },
        description: {
            required: false,
            type: "string",
            minLength: 1,
            maxLength: 10000
        },
        difficulty: {
            required: false,
            type: "string",
            enum: ["beginner", "intermediate", "advanced"]
        },
        language: {
            required: false,
            type: "string",
            maxLength: 30
        },
        instructions: {
            required: false,
            type: "string",
            maxLength: 20000
        },
        starterCode: {
            required: false,
            type: "string",
            maxLength: 500000
        },
        solutionCode: {
            required: false,
            type: "string",
            maxLength: 500000
        },
        testCases: {
            required: false,
            type: "string",
            maxLength: 500000
        },
        status: {
            required: false,
            type: "string",
            enum: ["draft", "published", "archived"]
        }
    }),
    updateChallengeController
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("admin"),
    deleteChallengeController
);

export default router;
