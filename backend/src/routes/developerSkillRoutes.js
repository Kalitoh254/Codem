import { Router } from "express";

import {
    listDeveloperSkillsController,
    addDeveloperSkillController,
    updateDeveloperSkillController,
    removeDeveloperSkillController
} from "../controllers/developerSkillController.js";

import { requireAuth } from "../middleware/auth.js";
import { requireSelfByParam } from "../middleware/ownership.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

router.get(
    "/:userId",
    requireAuth,
    listDeveloperSkillsController
);

router.post(
    "/:userId/:skillId",
    requireAuth,
    requireSelfByParam("userId"),
    validateBody({
        level: {
            required: false,
            type: "string",
            minLength: 1,
            maxLength: 20
        }
    }),
    addDeveloperSkillController
);

router.patch(
    "/:userId/:skillId",
    requireAuth,
    requireSelfByParam("userId"),
    validateBody({
        level: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 20
        }
    }),
    updateDeveloperSkillController
);

router.delete(
    "/:userId/:skillId",
    requireAuth,
    requireSelfByParam("userId"),
    removeDeveloperSkillController
);

export default router;
