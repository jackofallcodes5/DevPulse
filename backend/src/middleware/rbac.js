const workspaceRepo = require('../repositories/workspace.repository');
const projectRepo = require('../repositories/project.repository');
const { errorResponse } = require('../utils/apiResponse');

const ROLE_HIERARCHY = {
  OWNER: 4,
  ADMIN: 3,
  DEVELOPER: 2,
  VIEWER: 1,
};

const hasMinRole = (userRole, minRole) => {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
};

const requireWorkspaceMember = (minRole = 'VIEWER') => {
  return async (req, res, next) => {
    try {
      const workspaceId =
        req.params.workspaceId || req.params.id || req.body.workspaceId;

      if (!workspaceId) {
        return errorResponse(res, 'Workspace ID required', 400, 'MISSING_WORKSPACE_ID');
      }

      const member = await workspaceRepo.findMember(workspaceId, req.user.id);

      if (!member) {
        return errorResponse(
          res,
          'You are not a member of this workspace',
          403,
          'NOT_WORKSPACE_MEMBER'
        );
      }

      if (!hasMinRole(member.role, minRole)) {
        return errorResponse(
          res,
          'Insufficient permissions',
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      req.workspaceMember = member;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

const requireProjectMember = (minRole = 'VIEWER') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id;

      if (!projectId) {
        return errorResponse(res, 'Project ID required', 400, 'MISSING_PROJECT_ID');
      }

      const project = await projectRepo.findById(projectId);
      if (!project) {
        return errorResponse(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      const workspaceMember = await workspaceRepo.findMember(project.workspaceId, req.user.id);
      if (!workspaceMember) {
        return errorResponse(res, 'Access denied', 403, 'NOT_WORKSPACE_MEMBER');
      }

      const isWorkspaceAdmin = hasMinRole(workspaceMember.role, 'ADMIN');
      const projectMember = await projectRepo.findMember(projectId, req.user.id);

      if (!isWorkspaceAdmin && !projectMember) {
        return errorResponse(
          res,
          'You are not a member of this project',
          403,
          'NOT_PROJECT_MEMBER'
        );
      }

      const effectiveRole = isWorkspaceAdmin
        ? workspaceMember.role
        : projectMember.role;

      if (!hasMinRole(effectiveRole, minRole)) {
        return errorResponse(
          res,
          'Insufficient permissions',
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      req.project = project;
      req.projectMember = projectMember;
      req.workspaceMember = workspaceMember;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = { requireWorkspaceMember, requireProjectMember, hasMinRole };
