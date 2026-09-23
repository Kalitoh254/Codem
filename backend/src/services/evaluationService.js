/*
 * Safe evaluation foundation.
 *
 * This service deliberately DOES NOT execute submitted code.
 * No child_process, eval, Function, VM, shell, dynamic import,
 * filesystem execution, or network execution is permitted here.
 *
 * Real sandbox execution belongs in an isolated worker/container
 * architecture outside the API process.
 */

const SUPPORTED_LANGUAGES = new Set([
    "javascript",
    "typescript",
    "python",
    "java",
    "cpp",
    "c",
    "go",
    "rust"
]);

export function evaluateSubmission({ language }) {
    if (!SUPPORTED_LANGUAGES.has(language)) {
        return {
            status: "unsupported",
            score: null,
            feedback: "This language is not currently supported."
        };
    }

    return {
        status: "pending",
        score: null,
        feedback:
            "Submission accepted. Automated execution is disabled until an isolated evaluator is deployed."
    };
}
