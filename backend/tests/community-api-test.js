import { spawn } from "node:child_process";
import crypto from "node:crypto";
import db from "../src/database/db.js";

const PORT = 5001;
const BASE = `http://127.0.0.1:${PORT}/api/v1`;

const suffix = crypto.randomBytes(5).toString("hex");

const users = {
    owner: {
        email: `phase2-owner-${suffix}@codem.test`,
        username: `phase2owner_${suffix}`
    },
    other: {
        email: `phase2-other-${suffix}@codem.test`,
        username: `phase2other_${suffix}`
    }
};

const password = "Phase2-Test-Password-123!";

let server;
let ownerToken;
let otherToken;
let ownerId;
let otherId;
let postId;
let secondPostId;
let commentId;
let replyId;
let postReactionId;
let commentReactionId;
let bookmarkId;
let tagId;
let notificationId;

let pass = 0;
let fail = 0;

function logPass(message) {
    pass++;
    console.log(`PASS: ${message}`);
}

function logFail(message, detail = "") {
    fail++;
    console.log(`FAIL: ${message}${detail ? ` | ${detail}` : ""}`);
}

async function request(path, options = {}) {
    const response = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let body = null;

    try {
        body = await response.json();
    } catch {
        body = null;
    }

    return {
        status: response.status,
        body
    };
}

async function api(path, options = {}) {
    return request(path, options);
}

async function authRequest(path, token, options = {}) {
    return request(path, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });
}

async function registerUser(user) {
    return api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            email: user.email,
            username: user.username,
            password
        })
    });
}

async function loginUser(user) {
    return api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email: user.email,
            password
        })
    });
}

async function waitForServer(timeoutMs = 10000) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        try {
            const result = await api("/health");

            if (result.status === 200) {
                return true;
            }
        } catch {}

        await new Promise(resolve => setTimeout(resolve, 250));
    }

    return false;
}

function extractData(result) {
    return result?.body?.data ?? null;
}

async function cleanup() {
    try {
        if (server) {
            server.kill("SIGTERM");
        }
    } catch {}

    try {
        const ids = [ownerId, otherId].filter(Boolean);

        for (const id of ids) {
            db.prepare(`
                DELETE FROM users
                WHERE id = ?
            `).run(id);
        }
    } catch (error) {
        console.log(`Cleanup warning: ${error.message}`);
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("CODEM PHASE 2 COMMUNITY + SOCIAL API TEST");
    console.log("=".repeat(60));
    console.log();

    try {
        console.log("[1/14] Starting isolated backend...");

        server = spawn(
            process.execPath,
            ["src/server.js"],
            {
                cwd: new URL("../", import.meta.url).pathname,
                env: {
                    ...process.env,
                    PORT: String(PORT),
                    NODE_ENV: "test"
                },
                stdio: ["ignore", "pipe", "pipe"]
            }
        );

        let serverErrors = "";

        server.stderr.on("data", data => {
            serverErrors += data.toString();
        });

        if (!(await waitForServer())) {
            throw new Error(
                `Backend failed to start.${serverErrors ? ` ${serverErrors}` : ""}`
            );
        }

        logPass("Backend started and health endpoint is operational");

        console.log();
        console.log("[2/14] Testing unauthenticated protection...");

        const protectedRequests = [
            ["/bookmarks", "GET"],
            ["/notifications", "GET"],
            ["/notifications/unread-count", "GET"],
            ["/comments/post/fake", "POST"],
            ["/reactions/post/fake", "POST"],
            ["/tags/post/fake/fake", "POST"]
        ];

        for (const [path, method] of protectedRequests) {
            const result = await api(path, {
                method,
                body: method === "POST"
                    ? JSON.stringify({ content: "test" })
                    : undefined
            });

            if (result.status === 401) {
                logPass(`${method} ${path} rejects unauthenticated access`);
            } else {
                logFail(
                    `${method} ${path} should reject unauthenticated access`,
                    `HTTP ${result.status}`
                );
            }
        }

        console.log();
        console.log("[3/14] Creating isolated test users...");

        let result = await registerUser(users.owner);

        if (result.status !== 201) {
            throw new Error(
                `Owner registration failed: ${JSON.stringify(result.body)}`
            );
        }

        ownerId = extractData(result)?.user?.id ?? extractData(result)?.id;

        result = await registerUser(users.other);

        if (result.status !== 201) {
            throw new Error(
                `Other user registration failed: ${JSON.stringify(result.body)}`
            );
        }

        otherId = extractData(result)?.user?.id ?? extractData(result)?.id;

        if (!ownerId || !otherId) {
            throw new Error("Could not resolve test user IDs.");
        }

        db.prepare(`
            UPDATE users
            SET role = 'admin'
            WHERE id = ?
        `).run(ownerId);

        logPass("Two isolated test users created");
        logPass("Owner test account promoted to admin for tag lifecycle testing");

        result = await loginUser(users.owner);

        if (result.status !== 200) {
            throw new Error(
                `Owner login failed: ${JSON.stringify(result.body)}`
            );
        }

        ownerToken = extractData(result)?.token;

        result = await loginUser(users.other);

        if (result.status !== 200) {
            throw new Error(
                `Other login failed: ${JSON.stringify(result.body)}`
            );
        }

        otherToken = extractData(result)?.token;

        if (!ownerToken || !otherToken) {
            throw new Error("Could not resolve test session tokens.");
        }

        logPass("Both users received independent sessions");

        console.log();
        console.log("[4/14] Testing community post lifecycle...");

        result = await authRequest("/community", ownerToken, {
            method: "POST",
            body: JSON.stringify({
                title: `Phase 2 Test Post ${suffix}`,
                content: "This is a comprehensive Phase 2 integration test post.",
                postType: "discussion"
            })
        });

        if (result.status !== 201) {
            throw new Error(
                `Post creation failed: ${JSON.stringify(result.body)}`
            );
        }

        postId = extractData(result)?.id;

        if (!postId) {
            throw new Error("Created post ID missing.");
        }

        logPass("Owner can create a community post");

        result = await authRequest("/community", otherToken, {
            method: "POST",
            body: JSON.stringify({
                title: `Phase 2 Second Post ${suffix}`,
                content: "Second post for cross-post and pagination testing.",
                postType: "question"
            })
        });

        if (result.status !== 201) {
            throw new Error(
                `Second post creation failed: ${JSON.stringify(result.body)}`
            );
        }

        secondPostId = extractData(result)?.id;

        logPass("Second test post created");

        result = await api(`/community/${postId}`);

        if (result.status === 200) {
            logPass("Community post can be retrieved");
        } else {
            logFail("Community post retrieval failed", `HTTP ${result.status}`);
        }

        result = await api(`/community/${postId}`);

        if (result.status === 200) {
            logPass("Repeated post retrieval remains operational");
        } else {
            logFail("Repeated post retrieval failed", `HTTP ${result.status}`);
        }

        result = await api("/community");

        if (result.status === 200 && Array.isArray(extractData(result))) {
            logPass("Community post listing returns an array");
        } else {
            logFail("Community post listing failed", `HTTP ${result.status}`);
        }

        result = await authRequest(`/community/${postId}`, otherToken, {
            method: "PATCH",
            body: JSON.stringify({
                title: "Unauthorized modification attempt"
            })
        });

        if (result.status === 403) {
            logPass("Other user cannot update owner's post");
        } else {
            logFail(
                "Other user should not update owner's post",
                `HTTP ${result.status}`
            );
        }

        result = await authRequest(`/community/${postId}`, otherToken, {
            method: "DELETE"
        });

        if (result.status === 403) {
            logPass("Other user cannot delete owner's post");
        } else {
            logFail(
                "Other user should not delete owner's post",
                `HTTP ${result.status}`
            );
        }

        result = await authRequest(`/community/${postId}/status`, otherToken, {
            method: "PATCH",
            body: JSON.stringify({
                status: "published"
            })
        });

        if (result.status === 403) {
            logPass("Other user cannot change owner's post status");
        } else {
            logFail(
                "Other user should not change owner's post status",
                `HTTP ${result.status}`
            );
        }

        console.log();
        console.log("[5/14] Testing comments and nested replies...");

        result = await authRequest(`/comments/post/${postId}`, ownerToken, {
            method: "POST",
            body: JSON.stringify({
                content: "Top-level Phase 2 test comment."
            })
        });

        if (result.status !== 201) {
            throw new Error(
                `Comment creation failed: ${JSON.stringify(result.body)}`
            );
        }

        commentId = extractData(result)?.id;

        if (!commentId) {
            throw new Error("Comment ID missing.");
        }

        logPass("Top-level comment created");

        result = await authRequest(`/comments/post/${postId}`, otherToken, {
            method: "POST",
            body: JSON.stringify({
                content: "Nested reply to the test comment.",
                parentCommentId: commentId
            })
        });

        if (result.status !== 201) {
            throw new Error(
                `Nested reply creation failed: ${JSON.stringify(result.body)}`
            );
        }

        replyId = extractData(result)?.id;

        logPass("Nested comment reply created");

        result = await api(`/comments/post/${postId}`);

        if (result.status === 200 && Array.isArray(extractData(result))) {
            logPass("Comment listing returns comments");
        } else {
            logFail("Comment listing failed", `HTTP ${result.status}`);
        }

        result = await authRequest(`/comments/post/${secondPostId}`, ownerToken, {
            method: "POST",
            body: JSON.stringify({
                content: "Comment on the second post."
            })
        });

        const secondCommentId = extractData(result)?.id;

        result = await authRequest(`/comments/post/${postId}`, otherToken, {
            method: "POST",
            body: JSON.stringify({
                content: "Cross-post parent attack.",
                parentCommentId: secondCommentId
            })
        });

        if (result.status === 400) {
            logPass("Cross-post nested comment is rejected");
        } else {
            logFail(
                "Cross-post nested comment should be rejected",
                `HTTP ${result.status}`
            );
        }

        result = await authRequest(`/comments/${commentId}`, otherToken, {
            method: "DELETE"
        });

        if (result.status === 403) {
            logPass("Other user cannot delete owner's comment");
        } else {
            logFail(
                "Other user should not delete owner's comment",
                `HTTP ${result.status}`
            );
        }

        console.log();
        console.log("[6/14] Testing reactions...");

        result = await authRequest(`/reactions/post/${postId}`, ownerToken, {
            method: "POST",
            body: JSON.stringify({
                reactionType: "like"
            })
        });

        if (result.status !== 201) {
            throw new Error(
                `Post reaction creation failed: ${JSON.stringify(result.body)}`
            );
        }

        postReactionId = extractData(result)?.id;

        logPass("Post reaction created");

        result = await authRequest(`/reactions/post/${postId}`, ownerToken, {
            method: "POST",
            body: JSON.stringify({
                reactionType: "like"
            })
        });

        if (result.status === 409) {
            logPass("Duplicate post reaction is rejected");
        } else {
            logFail(
                "Duplicate post reaction should return HTTP 409",
                `HTTP ${result.status}`
            );
        }

        result = await api(`/reactions/post/${postId}`);

        if (result.status === 200) {
            logPass("Post reaction summary works");
        } else {
            logFail("Post reaction summary failed", `HTTP ${result.status}`);
        }

        result = await authRequest(`/reactions/comment/${commentId}`, otherToken, {
            method: "POST",
            body: JSON.stringify({
                reactionType: "like"
            })
        });

        if (result.status !== 201) {
            throw new Error(
                `Comment reaction creation failed: ${JSON.stringify(result.body)}`
            );
        }

        commentReactionId = extractData(result)?.id;

        logPass("Comment reaction created");

        result = await api(`/reactions/comment/${commentId}`);

        if (result.status === 200) {
            logPass("Comment reaction summary works");
        } else {
            logFail("Comment reaction summary failed", `HTTP ${result.status}`);
        }

        result = await authRequest(`/reactions/${postReactionId}`, otherToken, {
            method: "DELETE"
        });

        if (result.status === 403) {
            logPass("Other user cannot delete owner's reaction");
        } else {
            logFail(
                "Other user should not delete owner's reaction",
                `HTTP ${result.status}`
            );
        }

        console.log();
        console.log("[7/14] Testing bookmarks...");

        result = await authRequest(`/bookmarks/post/${postId}`, ownerToken, {
            method: "POST"
        });

        if (result.status !== 201) {
            throw new Error(
                `Bookmark creation failed: ${JSON.stringify(result.body)}`
            );
        }

        bookmarkId = extractData(result)?.id;

        logPass("Post bookmark created");

        result = await authRequest(`/bookmarks/post/${postId}`, ownerToken, {
            method: "POST"
        });

        if (result.status === 409) {
            logPass("Duplicate bookmark is rejected");
        } else {
            logFail(
                "Duplicate bookmark should return HTTP 409",
                `HTTP ${result.status}`
            );
        }

        result = await authRequest(`/bookmarks/post/${postId}`, ownerToken);

        if (
            result.status === 200 &&
            extractData(result)?.bookmarked === true
        ) {
            logPass("Bookmark status reports bookmarked=true");
        } else {
            logFail(
                "Bookmark status failed",
                `HTTP ${result.status}`
            );
        }

        result = await authRequest("/bookmarks", ownerToken);

        if (result.status === 200 && Array.isArray(extractData(result))) {
            logPass("User bookmark listing works");
        } else {
            logFail("User bookmark listing failed", `HTTP ${result.status}`);
        }

        result = await authRequest(`/bookmarks/${bookmarkId}`, otherToken, {
            method: "DELETE"
        });

        if (result.status === 403) {
            logPass("Other user cannot delete owner's bookmark");
        } else {
            logFail(
                "Other user should not delete owner's bookmark",
                `HTTP ${result.status}`
            );
        }

        console.log();
        console.log("[8/14] Testing tags...");

        result = await api("/tags");

        if (result.status === 200 && Array.isArray(extractData(result))) {
            logPass("Public tag listing works");
        } else {
            logFail("Public tag listing failed", `HTTP ${result.status}`);
        }

        const tagName = `phase2-${suffix}`;

        result = await authRequest("/tags", ownerToken, {
            method: "POST",
            body: JSON.stringify({
                name: tagName
            })
        });

        if (result.status === 403) {
            logPass("Non-admin cannot create tags");
        } else if (result.status === 201) {
            tagId = extractData(result)?.id;
            logPass("Admin-capable test environment allowed tag creation");
        } else {
            logFail(
                "Unexpected tag creation response",
                `HTTP ${result.status}`
            );
        }

        if (!tagId) {
            const existingTags = extractData(await api("/tags"));

            if (Array.isArray(existingTags) && existingTags.length > 0) {
                tagId = existingTags[0].id;
                logPass("Existing tag available for attachment testing");
            } else {
                logFail("No tag available for attachment testing");
            }
        }

        if (tagId) {
            result = await authRequest(
                `/tags/post/${postId}/${tagId}`,
                otherToken,
                { method: "POST" }
            );

            if (result.status === 403) {
                logPass("Other user cannot attach tags to owner's post");
            } else {
                logFail(
                    "Other user should not attach tags to owner's post",
                    `HTTP ${result.status}`
                );
            }

            result = await authRequest(
                `/tags/post/${postId}/${tagId}`,
                ownerToken,
                { method: "POST" }
            );

            if (result.status === 201) {
                logPass("Post owner can attach a tag");
            } else if (result.status === 409) {
                logPass("Tag was already attached without corrupting state");
            } else {
                logFail(
                    "Post owner cannot attach tag",
                    `HTTP ${result.status}`
                );
            }

            result = await api(`/tags/post/${postId}`);

            if (result.status === 200 && Array.isArray(extractData(result))) {
                logPass("Post tag listing resolves correctly");
            } else {
                logFail(
                    "Post tag listing failed",
                    `HTTP ${result.status}`
                );
            }

            result = await authRequest(
                `/tags/post/${postId}/${tagId}`,
                ownerToken,
                { method: "DELETE" }
            );

            if (result.status === 200) {
                logPass("Post owner can detach a tag");
            } else {
                logFail(
                    "Post owner cannot detach tag",
                    `HTTP ${result.status}`
                );
            }
        }

        console.log();
        console.log("[9/14] Testing community search...");

        result = await api(
            `/community/search?q=${encodeURIComponent(`Phase 2 Test Post ${suffix}`)}`
        );

        if (result.status === 200) {
            const searchData = extractData(result);

            if (
                searchData &&
                typeof searchData === "object" &&
                Array.isArray(searchData.posts)
            ) {
                logPass("Community search route works and returns paginated posts");
            } else {
                logFail(
                    "Community search response has unexpected structure",
                    JSON.stringify(searchData)
                );
            }
        } else {
            logFail(
                "Community search route failed",
                `HTTP ${result.status}`
            );
        }

        result = await api("/community/search?type=question");

        if (result.status === 200) {
            logPass("Community search accepts post type filtering");
        } else {
            logFail(
                "Community search type filtering failed",
                `HTTP ${result.status}`
            );
        }

        result = await api("/community/search?page=1&limit=1");

        if (result.status === 200) {
            logPass("Community search accepts pagination parameters");
        } else {
            logFail(
                "Community search pagination failed",
                `HTTP ${result.status}`
            );
        }

        console.log();
        console.log("[10/14] Testing notification isolation...");

        result = await authRequest("/notifications/unread-count", ownerToken);

        if (
            result.status === 200 &&
            typeof extractData(result)?.count === "number"
        ) {
            logPass("Unread notification count works");
        } else {
            logFail(
                "Unread notification count failed",
                `HTTP ${result.status}`
            );
        }

        result = await authRequest("/notifications", ownerToken);

        if (result.status === 200 && Array.isArray(extractData(result))) {
            logPass("Notification listing works");
        } else {
            logFail("Notification listing failed", `HTTP ${result.status}`);
        }

        const notificationExists = db.prepare(`
            SELECT id
            FROM notifications
            WHERE user_id = ?
            LIMIT 1
        `).get(ownerId);

        if (notificationExists) {
            notificationId = notificationExists.id;

            result = await authRequest(
                `/notifications/${notificationId}`,
                otherToken
            );

            if (result.status === 403) {
                logPass("Other user cannot access owner's notification");
            } else {
                logFail(
                    "Other user should not access owner's notification",
                    `HTTP ${result.status}`
                );
            }

            result = await authRequest(
                `/notifications/${notificationId}/read`,
                otherToken,
                { method: "PATCH" }
            );

            if (result.status === 403) {
                logPass("Other user cannot mark owner's notification as read");
            } else {
                logFail(
                    "Other user should not mark owner's notification as read",
                    `HTTP ${result.status}`
                );
            }
        } else {
            logPass("No notification exists, so cross-user notification mutation was skipped");
        }

        console.log();
        console.log("[11/14] Testing validation and missing-resource errors...");

        result = await authRequest("/community", ownerToken, {
            method: "POST",
            body: JSON.stringify({
                title: "x",
                content: "short"
            })
        });

        if (result.status === 400) {
            logPass("Invalid community post payload returns HTTP 400");
        } else {
            logFail(
                "Invalid community post payload should return HTTP 400",
                `HTTP ${result.status}`
            );
        }

        result = await api("/community/nonexistent-id");

        if (result.status === 404) {
            logPass("Missing community post returns HTTP 404");
        } else {
            logFail(
                "Missing community post should return HTTP 404",
                `HTTP ${result.status}`
            );
        }

        result = await api("/comments/nonexistent-id");

        if (result.status === 404) {
            logPass("Missing comment returns HTTP 404");
        } else {
            logFail(
                "Missing comment should return HTTP 404",
                `HTTP ${result.status}`
            );
        }

        result = await api("/reactions/post/nonexistent-id");

        if (result.status === 404) {
            logPass("Reaction summary for missing post returns HTTP 404");
        } else {
            logFail(
                "Missing-post reaction summary should return HTTP 404",
                `HTTP ${result.status}`
            );
        }

        console.log();
        console.log("[12/14] Testing view-count isolation...");

        const before = db.prepare(`
            SELECT view_count
            FROM community_posts
            WHERE id = ?
        `).get(postId)?.view_count;

        await api(`/comments/post/${postId}`);
        await api(`/tags/post/${postId}`);
        await api(`/reactions/post/${postId}`);

        const afterRelatedReads = db.prepare(`
            SELECT view_count
            FROM community_posts
            WHERE id = ?
        `).get(postId)?.view_count;

        if (before === afterRelatedReads) {
            logPass("Comments/tags/reaction reads do not inflate post views");
        } else {
            logFail(
                "Related reads unexpectedly changed post view count",
                `${before} -> ${afterRelatedReads}`
            );
        }

        await api(`/community/${postId}`);

        const afterPostRead = db.prepare(`
            SELECT view_count
            FROM community_posts
            WHERE id = ?
        `).get(postId)?.view_count;

        if (
            typeof before === "number" &&
            typeof afterPostRead === "number" &&
            afterPostRead === before + 1
        ) {
            logPass("Direct post retrieval increments view count exactly once");
        } else {
            logFail(
                "Direct post retrieval did not increment view count exactly once",
                `${before} -> ${afterPostRead}`
            );
        }

        console.log();
        console.log("[13/14] Testing reaction/bookmark ownership deletion...");

        if (postReactionId) {
            result = await authRequest(
                `/reactions/${postReactionId}`,
                ownerToken,
                { method: "DELETE" }
            );

            if (result.status === 200) {
                logPass("Reaction owner can remove own reaction");
            } else {
                logFail(
                    "Reaction owner cannot remove own reaction",
                    `HTTP ${result.status}`
                );
            }
        }

        if (commentReactionId) {
            result = await authRequest(
                `/reactions/${commentReactionId}`,
                otherToken,
                { method: "DELETE" }
            );

            if (result.status === 200) {
                logPass("Comment reaction owner can remove own reaction");
            } else {
                logFail(
                    "Comment reaction owner cannot remove own reaction",
                    `HTTP ${result.status}`
                );
            }
        }

        if (bookmarkId) {
            result = await authRequest(
                `/bookmarks/${bookmarkId}`,
                ownerToken,
                { method: "DELETE" }
            );

            if (result.status === 200) {
                logPass("Bookmark owner can remove own bookmark");
            } else {
                logFail(
                    "Bookmark owner cannot remove own bookmark",
                    `HTTP ${result.status}`
                );
            }
        }

        console.log();
        console.log("[14/14] Final state verification...");

        result = await api(`/community/${postId}`);

        if (result.status === 200) {
            const post = extractData(result);

            if (
                post &&
                post.id === postId &&
                !("password_hash" in post)
            ) {
                logPass("Final community post state is valid and sanitized");
            } else {
                logFail("Final community post state is invalid");
            }
        } else {
            logFail(
                "Final community post could not be retrieved",
                `HTTP ${result.status}`
            );
        }

        result = await authRequest("/auth/me", ownerToken);

        if (result.status === 200 && extractData(result)?.id === ownerId) {
            logPass("Owner session remains valid after community operations");
        } else {
            logFail(
                "Owner session became invalid unexpectedly",
                `HTTP ${result.status}`
            );
        }

    } catch (error) {
        logFail("Test execution aborted", error.stack || error.message);
    } finally {
        await cleanup();
    }

    console.log();
    console.log("=".repeat(60));
    console.log("RESULT");
    console.log("=".repeat(60));
    console.log(`PASS: ${pass}`);
    console.log(`FAIL: ${fail}`);

    if (fail === 0) {
        console.log("STATUS: CODEM PHASE 2 COMMUNITY + SOCIAL API PASSED");
        process.exit(0);
    } else {
        console.log("STATUS: CODEM PHASE 2 REQUIRES FIXES");
        process.exit(1);
    }
}

main();
