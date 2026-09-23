import { Router } from "express";

import {
    createApiKeyController,
    listApiKeysController,
    revokeApiKeyController
} from "../controllers/apiKeyController.js";

import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", createApiKeyController);

router.get("/", listApiKeysController);

router.delete(
    "/:id",
    revokeApiKeyController
);

export default router;
