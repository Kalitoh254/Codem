import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(
    new URL(".", import.meta.url).pathname,
    "../.."
);

const BACKEND_DIR = path.join(ROOT, "backend");
const BASE_URL = "http://127.0.0.1:5000/api/v1";

const testId = crypto.randomBytes(6).toString("hex");

const owner = {
    email: `codem.foundation.owner.${testId}@example.com`,
    username: `foundation_owner_${testId}`,
    password: "FoundationTest123!"
};

const second = {
    email: `codem.foundation.second.${testId}@example.com`,
    username: `foundation_second_${testId}`,
    password: "FoundationTest123!"
};

let server;
let ownerToken;
let secondToken;
let ownerUser;
let secondUser;
let project;
let projectFile;
let skill;

let passed = 0;
let failed = 0;

function pass(message) {
    passed++;
    console.log(`PASS: ${message}`);
}

function fail(message, detail = "") {
    failed++;
    console.log(`FAIL: ${message}`);
    if (detail) {
        console.log(`     ${detail}`);
    }
}

async function request(
    method,
    endpoint,
    {
        token,
        body,
        expectedStatus
    } = {}
) {
    const headers = {};

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${BASE_URL}${endpoint}`,
        {
            method,
            headers,
            body:
                body !== undefined
                    ? JSON.stringify(body)
                    : undefined
        }
    );

    let data = null;

    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (
        expectedStatus !== undefined &&
        response.status !== expectedStatus
    ) {
        throw new Error(
            `${method} ${endpoint} expected HTTP ${expectedStatus}, got ${response.status}: ${JSON.stringify(data)}`
        );
    }

    return {
        response,
        data
    };
}

function assert(condition, message) {
    if (condition) {
        pass(message);
    } else {
        fail(message);
    }
}

async function waitForBackend() {
    const deadline = Date.now() + 10000;

    while (Date.now() < deadline) {
        try {
            const result = await request(
                "GET",
                "/health"
            );

            if (result.response.status === 200) {
                return;
            }
        } catch {
            // Backend not ready yet.
        }

        await new Promise(
            resolve => setTimeout(resolve, 200)
        );
    }

    throw new Error(
        "Backend did not become ready within 10 seconds."
    );
}

function startBackend() {
    const auditTmp = path.join(
        ROOT,
        ".audit-tmp"
    );

    fs.mkdirSync(auditTmp, {
        recursive: true
    });

    server = spawn(
        process.execPath,
        ["src/server.js"],
        {
            cwd: BACKEND_DIR,
            env: {
                ...process.env,
                PORT: "5000"
            },
            stdio: [
                "ignore",
                "pipe",
                "pipe"
            ]
        }
    );

    server.stdout.on("data", data => {
        fs.appendFileSync(
            path.join(
                auditTmp,
                "api-foundation-server.log"
            ),
            data
        );
    });

    server.stderr.on("data", data => {
        fs.appendFileSync(
            path.join(
                auditTmp,
                "api-foundation-server-error.log"
            ),
            data
        );
    });
}

async function cleanup() {
    try {
        if (project?.id && ownerToken) {
            await request(
                "DELETE",
                `/projects/${project.id}`,
                {
                    token: ownerToken
                }
            );
        }
    } catch {}

    if (server) {
        server.kill("SIGTERM");

        await new Promise(resolve => {
            const timer = setTimeout(
                () => {
                    try {
                        server.kill("SIGKILL");
                    } catch {}

                    resolve();
                },
                2000
            );

            server.once(
                "exit",
                () => {
                    clearTimeout(timer);
                    resolve();
                }
            );
        });
    }
}

process.on(
    "SIGINT",
    async () => {
        await cleanup();
        process.exit(130);
    }
);

console.log("");
console.log("============================================================");
console.log("CODEM API FOUNDATION INTEGRATION TEST");
console.log("============================================================");

try {
    console.log("");
    console.log("[1/12] Starting backend...");

    startBackend();
    await waitForBackend();

    pass("Backend started and health endpoint is operational");

    console.log("");
    console.log("[2/12] Testing unauthenticated protection...");

    const protectedEndpoints = [
        ["/users", "GET"],
        ["/developers/me/dashboard", "GET"],
        ["/projects/mine", "GET"],
        ["/bookmarks", "GET"],
        ["/notifications", "GET"],
        ["/submissions", "GET"]
    ];

    for (const [endpoint, method] of protectedEndpoints) {
        const result = await request(
            method,
            endpoint
        );

        assert(
            result.response.status === 401,
            `${method} ${endpoint} rejects unauthenticated access`
        );
    }

    console.log("");
    console.log("[3/12] Testing registration...");

    const ownerRegistration = await request(
        "POST",
        "/auth/register",
        {
            body: owner,
            expectedStatus: 201
        }
    );

    assert(
        ownerRegistration.data?.success === true,
        "Registration uses standard success envelope"
    );

    assert(
        !ownerRegistration.data?.data?.password_hash,
        "Registration response does not expose password hash"
    );

    ownerUser = ownerRegistration.data.data.user;

    const secondRegistration = await request(
        "POST",
        "/auth/register",
        {
            body: second,
            expectedStatus: 201
        }
    );

    secondUser = secondRegistration.data.data.user;

    assert(
        ownerUser?.id &&
        secondUser?.id &&
        ownerUser.id !== secondUser.id,
        "Two isolated test users were created"
    );

    console.log("");
    console.log("[4/12] Testing duplicate registration and validation...");

    const duplicate = await request(
        "POST",
        "/auth/register",
        {
            body: owner
        }
    );

    assert(
        duplicate.response.status >= 400 &&
        duplicate.response.status < 500,
        "Duplicate registration is rejected"
    );

    const invalidRegistration = await request(
        "POST",
        "/auth/register",
        {
            body: {
                email: "bad",
                username: "x",
                password: "123"
            }
        }
    );

    assert(
        invalidRegistration.response.status === 400,
        "Invalid registration payload is rejected with HTTP 400"
    );

    console.log("");
    console.log("[5/12] Testing login and sessions...");

    const ownerLogin = await request(
        "POST",
        "/auth/login",
        {
            body: {
                email: owner.email,
                password: owner.password
            },
            expectedStatus: 200
        }
    );

    ownerToken = ownerLogin.data?.data?.token;

    assert(
        typeof ownerToken === "string" &&
        ownerToken.length >= 32,
        "Login returns a session token"
    );

    const secondLogin = await request(
        "POST",
        "/auth/login",
        {
            body: {
                email: second.email,
                password: second.password
            },
            expectedStatus: 200
        }
    );

    secondToken = secondLogin.data?.data?.token;

    assert(
        typeof secondToken === "string" &&
        secondToken.length >= 32,
        "Second user receives an independent session"
    );

    const me = await request(
        "GET",
        "/auth/me",
        {
            token: ownerToken,
            expectedStatus: 200
        }
    );

    assert(
        me.data?.data?.id === ownerUser.id,
        "Authenticated /me resolves the correct user"
    );

    assert(
        !me.data?.data?.password_hash,
        "/me does not expose password hash"
    );

    console.log("");
    console.log("[6/12] Testing developer profile ownership...");

    const profile = await request(
        "GET",
        `/developers/${ownerUser.id}`,
        {
            token: ownerToken,
            expectedStatus: 200
        }
    );

    assert(
        profile.data?.success === true,
        "Developer profile GET works"
    );

    const profileUpdate = await request(
        "PATCH",
        `/developers/${ownerUser.id}`,
        {
            token: ownerToken,
            body: {
                display_name: "Foundation Test Developer",
                bio: "Integration test profile",
                github_url: "https://github.com/example"
            },
            expectedStatus: 200
        }
    );

    assert(
        profileUpdate.data?.data?.display_name ===
            "Foundation Test Developer",
        "Developer profile owner can update own profile"
    );

    const forbiddenProfileUpdate = await request(
        "PATCH",
        `/developers/${ownerUser.id}`,
        {
            token: secondToken,
            body: {
                display_name: "Unauthorized Update"
            }
        }
    );

    assert(
        forbiddenProfileUpdate.response.status === 403,
        "Another user cannot update developer profile"
    );

    console.log("");
    console.log("[7/12] Testing developer skills...");

    const skills = await request(
        "GET",
        `/developers/skills/${ownerUser.id}`,
        {
            token: ownerToken,
            expectedStatus: 200
        }
    );

    assert(
        skills.data?.success === true &&
        Array.isArray(skills.data?.data),
        "Developer skills endpoint returns an array"
    );

    const skillList = await request(
        "GET",
        "/skills",
        {
            expectedStatus: 200
        }
    );

    assert(
        skillList.data?.success === true &&
        Array.isArray(skillList.data?.data),
        "Public skill listing works"
    );

    if (skillList.data.data.length > 0) {
        skill = skillList.data.data[0];

        const addSkill = await request(
            "POST",
            `/developers/skills/${ownerUser.id}/${skill.id}`,
            {
                token: ownerToken,
                body: {
                    level: "advanced"
                },
                expectedStatus: 201
            }
        );

        assert(
            addSkill.data?.success === true,
            "Developer can add a skill"
        );

        const secondSkillWrite = await request(
            "POST",
            `/developers/skills/${ownerUser.id}/${skill.id}`,
            {
                token: secondToken,
                body: {
                    level: "expert"
                }
            }
        );

        assert(
            secondSkillWrite.response.status === 403,
            "Another user cannot modify developer skills"
        );
    } else {
        console.log(
            "INFO: No skills seeded, skill mutation test skipped."
        );
    }

    console.log("");
    console.log("[8/12] Testing project creation and access control...");

    const createProject = await request(
        "POST",
        "/projects",
        {
            token: ownerToken,
            body: {
                name: `Foundation Project ${testId}`,
                description: "API foundation integration test",
                visibility: "private"
            },
            expectedStatus: 201
        }
    );

    project = createProject.data.data;

    assert(
        createProject.data?.success === true &&
        project?.id,
        "Authenticated user can create a private project"
    );

    const ownerProject = await request(
        "GET",
        `/projects/${project.id}`,
        {
            token: ownerToken,
            expectedStatus: 200
        }
    );

    assert(
        ownerProject.data?.data?.id === project.id,
        "Project owner can access private project"
    );

    const secondProjectAccess = await request(
        "GET",
        `/projects/${project.id}`,
        {
            token: secondToken
        }
    );

    assert(
        secondProjectAccess.response.status === 403,
        "Non-member cannot access private project"
    );

    console.log("");
    console.log("[9/12] Testing project ownership...");

    const unauthorizedProjectUpdate = await request(
        "PATCH",
        `/projects/${project.id}`,
        {
            token: secondToken,
            body: {
                name: "Unauthorized Project Rename"
            }
        }
    );

    assert(
        unauthorizedProjectUpdate.response.status === 403,
        "Non-owner cannot update project"
    );

    const unauthorizedProjectDelete = await request(
        "DELETE",
        `/projects/${project.id}`,
        {
            token: secondToken
        }
    );

    assert(
        unauthorizedProjectDelete.response.status === 403,
        "Non-owner cannot delete project"
    );

    const ownerProjectUpdate = await request(
        "PATCH",
        `/projects/${project.id}`,
        {
            token: ownerToken,
            body: {
                description: "Updated foundation test project"
            },
            expectedStatus: 200
        }
    );

    assert(
        ownerProjectUpdate.data?.data?.description ===
            "Updated foundation test project",
        "Project owner can update project"
    );

    console.log("");
    console.log("[10/12] Testing project files...");

    const createFile = await request(
        "POST",
        `/projects/files/${project.id}`,
        {
            token: ownerToken,
            body: {
                path: "src/main.js",
                content: "console.log('Codem');"
            },
            expectedStatus: 201
        }
    );

    projectFile = createFile.data.data;

    assert(
        createFile.data?.success === true &&
        projectFile?.id,
        "Project owner can create a project file"
    );

    const files = await request(
        "GET",
        `/projects/files/${project.id}`,
        {
            token: ownerToken,
            expectedStatus: 200
        }
    );

    assert(
        files.data?.success === true &&
        Array.isArray(files.data?.data),
        "Project file listing works"
    );

    const unauthorizedFileRead = await request(
        "GET",
        `/projects/files/${project.id}`,
        {
            token: secondToken
        }
    );

    assert(
        unauthorizedFileRead.response.status === 403,
        "Non-member cannot read private project files"
    );

    console.log("");
    console.log("[11/12] Testing validation and error envelopes...");

    const invalidProject = await request(
        "POST",
        "/projects",
        {
            token: ownerToken,
            body: {
                name: ""
            }
        }
    );

    assert(
        invalidProject.response.status === 400,
        "Invalid project payload returns HTTP 400"
    );

    assert(
        invalidProject.data?.success === false ||
        invalidProject.data?.error,
        "Validation errors use an error response structure"
    );

    const missingProject = await request(
        "GET",
        "/projects/nonexistent-project-id",
        {
            token: ownerToken
        }
    );

    assert(
        missingProject.response.status === 404,
        "Missing project returns HTTP 404"
    );

    console.log("");
    console.log("[12/12] Testing logout/session invalidation...");

    const logout = await request(
        "POST",
        "/auth/logout",
        {
            token: ownerToken,
            expectedStatus: 200
        }
    );

    assert(
        logout.data?.success === true,
        "Logout succeeds"
    );

    const afterLogout = await request(
        "GET",
        "/auth/me",
        {
            token: ownerToken
        }
    );

    assert(
        afterLogout.response.status === 401,
        "Revoked session cannot access authenticated endpoints"
    );

    console.log("");
    console.log("============================================================");
    console.log("RESULT");
    console.log("============================================================");
    console.log(`PASS: ${passed}`);
    console.log(`FAIL: ${failed}`);

    if (failed === 0) {
        console.log(
            "STATUS: CODEM API FOUNDATION INTEGRATION PASSED"
        );
    } else {
        console.log(
            "STATUS: CODEM API FOUNDATION INTEGRATION FAILED"
        );
        process.exitCode = 1;
    }
} catch (error) {
    console.error("");
    console.error("FATAL TEST ERROR:");
    console.error(error);
    process.exitCode = 1;
} finally {
    await cleanup();
}
