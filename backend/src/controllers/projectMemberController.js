import * as service from "../services/projectMemberService.js";

export function listMembersController(req, res, next) {
    try {
        res.json({
            success: true,
            data: service.getMembers(req.params.projectId)
        });
    } catch (error) {
        next(error);
    }
}

export function addMemberController(req, res, next) {
    try {
        const member = service.addMember(
            req.params.projectId,
            req.body.userId,
            req.body.role
        );

        res.status(201).json({
            success: true,
            data: member
        });
    } catch (error) {
        next(error);
    }
}

export function updateMemberController(req, res, next) {
    try {
        const member = service.editMember(
            req.params.projectId,
            req.params.userId,
            req.body.role
        );

        res.json({
            success: true,
            data: member
        });
    } catch (error) {
        next(error);
    }
}

export function deleteMemberController(req, res, next) {
    try {
        const result = service.removeMember(
            req.params.projectId,
            req.params.userId
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}
