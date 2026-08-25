const workspaceService = require('../services/workspace.service');
const { successResponse } = require('../utils/apiResponse');

const createWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.createWorkspace(req.user.id, req.body);
    return successResponse(res, { workspace }, 201, 'Workspace created successfully');
  } catch (err) {
    return next(err);
  }
};

const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await workspaceService.getUserWorkspaces(req.user.id);
    return successResponse(res, { workspaces });
  } catch (err) {
    return next(err);
  }
};

const getWorkspaceById = async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id);
    return successResponse(res, { workspace });
  } catch (err) {
    return next(err);
  }
};

const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.updateWorkspace(req.params.id, req.body);
    return successResponse(res, { workspace }, 200, 'Workspace updated successfully');
  } catch (err) {
    return next(err);
  }
};

const deleteWorkspace = async (req, res, next) => {
  try {
    await workspaceService.deleteWorkspace(req.params.id);
    return successResponse(res, null, 200, 'Workspace deleted successfully');
  } catch (err) {
    return next(err);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const members = await workspaceService.getWorkspaceMembers(req.params.id);
    return successResponse(res, { members });
  } catch (err) {
    return next(err);
  }
};

const inviteMember = async (req, res, next) => {
  try {
    const member = await workspaceService.inviteMember(req.params.id, req.body);
    return successResponse(res, { member }, 201, 'Member invited successfully');
  } catch (err) {
    return next(err);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const member = await workspaceService.updateMemberRole(
      req.params.id,
      req.params.userId,
      req.body.role
    );
    return successResponse(res, { member }, 200, 'Role updated successfully');
  } catch (err) {
    return next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    await workspaceService.removeMember(req.params.id, req.params.userId);
    return successResponse(res, null, 200, 'Member removed successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
};
