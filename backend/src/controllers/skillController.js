import {
    createNewSkill,
    getSkillById,
    getSkills
} from "../services/skillService.js";

export function listSkillsController(_req, res, next) {
    try {
        const skills = getSkills();

        res.status(200).json({
            success: true,
            data: skills
        });
    } catch (error) {
        next(error);
    }
}

export function getSkillController(req, res, next) {
    try {
        const skill = getSkillById(req.params.id);

        res.status(200).json({
            success: true,
            data: skill
        });
    } catch (error) {
        next(error);
    }
}

export function createSkillController(req, res, next) {
    try {
        const skill = createNewSkill({
            name: req.body.name,
            slug: req.body.slug,
            description: req.body.description
        });

        res.status(201).json({
            success: true,
            data: skill
        });
    } catch (error) {
        next(error);
    }
}
