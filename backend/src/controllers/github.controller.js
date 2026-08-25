const githubService = require('../services/github.service');
const { successResponse } = require('../utils/apiResponse');

const getRepositories = async (req, res, next) => {
  try {
    const repositories = await githubService.getUserRepositories(req.user.id);
    return successResponse(res, { repositories });
  } catch (err) {
    return next(err);
  }
};

const connectRepository = async (req, res, next) => {
  try {
    const { repositoryId, projectId } = req.body;
    const repository = await githubService.connectRepository(req.user.id, repositoryId, projectId);
    return successResponse(res, { repository }, 200, 'Repository connected to project');
  } catch (err) {
    return next(err);
  }
};

const disconnectRepository = async (req, res, next) => {
  try {
    await githubService.disconnectRepository(req.user.id, req.params.id);
    return successResponse(res, null, 200, 'Repository disconnected');
  } catch (err) {
    return next(err);
  }
};

const getCommits = async (req, res, next) => {
  try {
    const commits = await githubService.getRepositoryCommits(req.user.id, req.params.id, req.query);
    return successResponse(res, { commits });
  } catch (err) {
    return next(err);
  }
};

const getPullRequests = async (req, res, next) => {
  try {
    const pulls = await githubService.getRepositoryPullRequests(req.user.id, req.params.id, req.query);
    return successResponse(res, { pulls });
  } catch (err) {
    return next(err);
  }
};

const getBranches = async (req, res, next) => {
  try {
    const branches = await githubService.getRepositoryBranches(req.user.id, req.params.id);
    return successResponse(res, { branches });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getRepositories,
  connectRepository,
  disconnectRepository,
  getCommits,
  getPullRequests,
  getBranches,
};
