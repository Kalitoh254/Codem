export function validateBody(rules) {
    return (req, _res, next) => {
        try {
            const body = req.body || {};

            for (const [field, rule] of Object.entries(rules)) {
                const value = body[field];

                if (
                    rule.required &&
                    (value === undefined ||
                        value === null ||
                        value === "")
                ) {
                    const error = new Error(
                        `${field} is required.`
                    );

                    error.status = 400;
                    error.code = "VALIDATION_ERROR";

                    throw error;
                }

                if (
                    value !== undefined &&
                    value !== null &&
                    rule.type &&
                    typeof value !== rule.type
                ) {
                    const error = new Error(
                        `${field} must be a ${rule.type}.`
                    );

                    error.status = 400;
                    error.code = "VALIDATION_ERROR";

                    throw error;
                }

                if (
                    typeof value === "string" &&
                    rule.minLength &&
                    value.length < rule.minLength
                ) {
                    const error = new Error(
                        `${field} must contain at least ${rule.minLength} characters.`
                    );

                    error.status = 400;
                    error.code = "VALIDATION_ERROR";

                    throw error;
                }

                if (
                    typeof value === "string" &&
                    rule.maxLength &&
                    value.length > rule.maxLength
                ) {
                    const error = new Error(
                        `${field} must contain no more than ${rule.maxLength} characters.`
                    );

                    error.status = 400;
                    error.code = "VALIDATION_ERROR";

                    throw error;
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}
