export function validateBody(rules) {
    return (req, _res, next) => {
        try {
            const body = req.body || {};

            for (const [field, rule] of Object.entries(rules)) {
                const value = body[field];

                if (
                    rule.required &&
                    (
                        value === undefined ||
                        value === null ||
                        value === ""
                    )
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
                    rule.type
                ) {
                    let validType = true;

                    if (rule.type === "array") {
                        validType = Array.isArray(value);
                    } else {
                        validType =
                            typeof value === rule.type;
                    }

                    if (!validType) {
                        const error = new Error(
                            `${field} must be a ${rule.type}.`
                        );

                        error.status = 400;
                        error.code = "VALIDATION_ERROR";

                        throw error;
                    }
                }

                if (
                    typeof value === "string" &&
                    rule.minLength !== undefined &&
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
                    rule.maxLength !== undefined &&
                    value.length > rule.maxLength
                ) {
                    const error = new Error(
                        `${field} must contain no more than ${rule.maxLength} characters.`
                    );

                    error.status = 400;
                    error.code = "VALIDATION_ERROR";

                    throw error;
                }

                if (
                    value !== undefined &&
                    value !== null &&
                    Array.isArray(rule.enum) &&
                    !rule.enum.includes(value)
                ) {
                    const error = new Error(
                        `${field} must be one of: ${rule.enum.join(", ")}.`
                    );

                    error.status = 400;
                    error.code = "VALIDATION_ERROR";

                    throw error;
                }

                if (
                    Array.isArray(value) &&
                    rule.minItems !== undefined &&
                    value.length < rule.minItems
                ) {
                    const error = new Error(
                        `${field} must contain at least ${rule.minItems} items.`
                    );

                    error.status = 400;
                    error.code = "VALIDATION_ERROR";

                    throw error;
                }

                if (
                    Array.isArray(value) &&
                    rule.maxItems !== undefined &&
                    value.length > rule.maxItems
                ) {
                    const error = new Error(
                        `${field} must contain no more than ${rule.maxItems} items.`
                    );

                    error.status = 400;
                    error.code = "VALIDATION_ERROR";

                    throw error;
                }

                if (
                    Array.isArray(value) &&
                    rule.itemType
                ) {
                    const invalidItem = value.some(
                        item =>
                            typeof item !== rule.itemType
                    );

                    if (invalidItem) {
                        const error = new Error(
                            `${field} items must be ${rule.itemType}s.`
                        );

                        error.status = 400;
                        error.code = "VALIDATION_ERROR";

                        throw error;
                    }
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}
