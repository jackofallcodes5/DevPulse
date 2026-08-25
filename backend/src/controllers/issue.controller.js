const issueService = require('../services/issue.service');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

const createIssue = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const issue = await issueService.createIssue(projectId, req.user.id, req.body);
    return successResponse(res, { issue }, 201, 'Issue created successfully');
  } catch (err) {
    return next(err);
  }
};

const getProjectIssues = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const result = await issueService.getProjectIssues(projectId, req.query);
    return paginatedResponse(res, result.issues, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    });
  } catch (err) {
    return next(err);
  }
};

const getKanbanBoard = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const columns = await issueService.getKanbanBoard(projectId);
    return successResponse(res, { columns });
  } catch (err) {
    return next(err);
  }
};

const getIssueById = async (req, res, next) => {
  try {
    const issue = await issueService.getIssueById(req.params.id);
    return successResponse(res, { issue });
  } catch (err) {
    return next(err);
  }
};

const updateIssue = async (req, res, next) => {
  try {
    const issue = await issueService.updateIssue(req.params.id, req.user.id, req.body);
    return successResponse(res, { issue }, 200, 'Issue updated successfully');
  } catch (err) {
    return next(err);
  }
};

const deleteIssue = async (req, res, next) => {
  try {
    await issueService.deleteIssue(req.params.id, req.user.id);
    return successResponse(res, null, 200, 'Issue deleted successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createIssue,
  getProjectIssues,
  getKanbanBoard,
  getIssueById,
  updateIssue,
  deleteIssue,
};
