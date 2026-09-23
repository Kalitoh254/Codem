import {
    addDeveloperSkill,
    updateDeveloperSkill,
    removeDeveloperSkill,
    getDeveloperSkills
} from "../services/developerSkillService.js";

export function listDeveloperSkillsController(req, res, next) {
    try {
        const skills = getDeveloperSkills(req.params.userId);

        res.status(200).json({
            success: true,
            data: skills
        });
    } catch (error) {
        next(error);
    }
}

export function addDeveloperSkillController(req, res, next) {
    try {
        const skill = addDeveloperSkill(
            req.user.id,
            req.params.skillId,
            req.body.level || "beginner"
        );

        res.status(201).json({
            success: true,
            data: skill
        });
    } catch (error) {
        next(error);
    }
}

export function updateDeveloperSkillController(req, res, next) {
    try {
        const skill = updateDeveloperSkill(
            req.user.id,
            req.params.skillId,
            req.body.level
        );

        res.status(200).json({
            success: true,
            data: skill
        });
    } catch (error) {
        next(error);
    }
}

export function removeDeveloperSkillController(req, res, next) {
    try {
        const result = removeDeveloperSkill(
            req.user.id,
            req.params.skillId
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
