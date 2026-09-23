import {
    findProfileByUserId,
    updateProfile
} from "../repositories/profileRepository.js";

export function getProfile(userId) {
    const profile = findProfileByUserId(userId);

    if (!profile) {
        const error = new Error("Profile not found.");

        error.status = 404;
        error.code = "PROFILE_NOT_FOUND";

        throw error;
    }

    return profile;
}

export function updateUserProfile(userId, fields) {
    const profile = getProfile(userId);

    const allowedFields = [
        "display_name",
        "bio",
        "avatar_url",
        "location",
        "website_url",
        "github_url",
        "linkedin_url"
    ];

    const updates = {};

    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(fields, field)) {
            updates[field] = fields[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return profile;
    }

    return updateProfile(userId, updates);
}
