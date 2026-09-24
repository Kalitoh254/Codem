import express from "express";
import cors from "cors";
import helmet from "helmet";
import projectRoutes from "./routes/projectRoutes.js";
import projectMemberRoutes from "./routes/projectMemberRoutes.js";
import projectFileRoutes from "./routes/projectFileRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import moduleRoutes from "./routes/moduleRoutes.js";
import learningRoutes from "./routes/learningRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import developerDashboardRoutes from "./routes/developerDashboardRoutes.js";
import developerProfileRoutes from "./routes/developerProfileRoutes.js";
import developerSkillRoutes from "./routes/developerSkillRoutes.js";

import healthRoutes from "./routes/healthRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import reactionRoutes from "./routes/reactionRoutes.js";
import bookmarkRoutes from "./routes/bookmarkRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";
import emailVerificationRoutes from "./routes/emailVerificationRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import apiKeyRoutes from "./routes/apiKeyRoutes.js";
import developerApiRoutes from "./routes/developerApiRoutes.js";
import env from "./config/env.js";

import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
    cors({
        origin(origin, callback) {
            // Non-browser requests and same-origin requests have no Origin header.
            if (!origin) {
                return callback(null, true);
            }

            // Explicitly configured origins are allowed.
            if (env.corsOrigins.includes(origin)) {
                return callback(null, true);
            }

            const error = new Error(
                "Origin is not allowed by CORS policy."
            );

            error.status = 403;
            error.code = "CORS_ORIGIN_NOT_ALLOWED";

            return callback(error);
        },
        credentials: true
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
    res.json({
        success: true,
        name: "Codem API",
        version: "0.1.0"
    });
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/auth/password-reset", passwordResetRoutes);
app.use("/api/v1/auth/email-verification", emailVerificationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/admin/audit-logs", auditLogRoutes);
app.use("/api/v1/api-keys", apiKeyRoutes);
app.use("/api/v1/developer", developerApiRoutes);
app.use("/api/v1/skills", skillRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/reactions", reactionRoutes);
app.use("/api/v1/bookmarks", bookmarkRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/tags", tagRoutes);

app.use("/api/v1/projects/members", projectMemberRoutes);
app.use("/api/v1/projects/files", projectFileRoutes);
app.use("/api/v1/projects", projectRoutes);

app.use("/api/v1/certificates", certificateRoutes);
app.use("/api/v1/learning", learningRoutes);
app.use("/api/v1/lessons", lessonRoutes);
app.use("/api/v1/modules", moduleRoutes);
app.use("/api/v1/courses", courseRoutes);

app.use("/api/v1/developers/skills", developerSkillRoutes);
app.use("/api/v1/developers", developerDashboardRoutes);
app.use("/api/v1/developers", developerProfileRoutes);

app.use("/api/v1/challenges", challengeRoutes);
app.use("/api/v1/submissions", submissionRoutes);

app.use(notFound);
app.use(errorHandler);


export default app;












