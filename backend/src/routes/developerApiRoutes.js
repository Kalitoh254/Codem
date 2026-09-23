import { Router } from "express";

import {
    requireApiKey,
    requireScope
} from "../middleware/apiKeyAuth.js";

const router = Router();

router.get(
    "/identity",
    requireApiKey,
    requireScope("read"),
    (req, res) => {
        res.status(200).json({
            success: true,
            data: {
                authentication: "api_key",
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    role: req.user.role
                },
                apiKey: {
                    id: req.apiKey.id,
                    name: req.apiKey.name,
                    scopes: req.apiKey.scopes,
                    key_prefix:
                        req.apiKey.key_prefix
                }
            }
        });
    }
);

router.post(
    "/write-test",
    requireApiKey,
    requireScope("write"),
    (req, res) => {
        res.status(200).json({
            success: true,
            data: {
                authentication: "api_key",
                operation: "write",
                userId: req.user.id
            }
        });
    }
);

export default router;
