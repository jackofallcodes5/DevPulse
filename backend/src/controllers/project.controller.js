const projectService = require('../services/project.service');
const { successResponse } = require('../utils/apiResponse');

const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.user.id, req.body);
    return successResponse(res, { project }, 201, 'Project created successfully');
  } catch (err) {
    return next(err);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const workspaceId = req.query.workspaceId;
    const projects = await projectService.getWorkspaceProjects(workspaceId);
    return successResponse(res, { projects });
  } catch (err) {
    return next(err);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    return successResponse(res, { project });
  } catch (err) {
    return next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    return successResponse(res, { project }, 200, 'Project updated successfully');
  } catch (err) {
    return next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id);
    return successResponse(res, null, 200, 'Project deleted successfully');
  } catch (err) {
    return next(err);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const members = await projectService.getProjectMembers(req.params.id);
    return successResponse(res, { members });
  } catch (err) {
    return next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const member = await projectService.addProjectMember(
      req.params.id,
      req.body.userId,
      req.body.role
    );
    return successResponse(res, { member }, 201, 'Member added successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getMembers,
  addMember,
};
