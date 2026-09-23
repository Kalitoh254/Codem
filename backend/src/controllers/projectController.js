import * as projectService from "../services/projectService.js";

export async function createProjectController(req, res, next) {
    try {
        const project = await projectService.createNewProject(
            req.user.id,
            req.body
        );

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
}

export async function getProjectController(req, res, next) {
    try {
        const project = await projectService.getProject(req.params.id);

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
}

export async function listMyProjectsController(req, res, next) {
    try {
        const projects = await projectService.getDeveloperProjects(req.user.id);

        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        next(error);
    }
}

export async function listPublicProjectsController(req, res, next) {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit, 10) || 20, 1),
            50
        );

        const result = await projectService.getPublicProjects(
            page,
            limit
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export async function updateProjectController(req, res, next) {
    try {
        const project = await projectService.editProject(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteProjectController(req, res, next) {
    try {
        await projectService.removeProject(req.params.id);

        res.json({
            success: true,
            data: {
                deleted: true
            }
        });
    } catch (error) {
        next(error);
    }
}
