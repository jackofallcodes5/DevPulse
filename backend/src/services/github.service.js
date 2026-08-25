const githubRepo = require('../repositories/github.repository');
const githubIntegration = require('../integrations/github');

const getUserRepositories = async (userId) => {
  const account = await githubRepo.findAccountByUserId(userId);
  if (!account) {
    const err = new Error('GitHub account not connected');
    err.statusCode = 400;
    err.errorCode = 'GITHUB_NOT_CONNECTED';
    throw err;
  }

  // Fetch repos from GitHub API
  const remoteRepos = await githubIntegration.getUserRepositories(account.accessToken);

  // Upsert all into DB
  const repos = [];
  for (const repoData of remoteRepos) {
    const repo = await githubRepo.upsertRepo(account.id, {
      githubId: repoData.id,
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      private: repoData.private,
      url: repoData.html_url,
      cloneUrl: repoData.clone_url,
      defaultBranch: repoData.default_branch || 'main',
    });
    repos.push(repo);
  }

  return repos;
};

const connectRepository = async (userId, repoId, projectId) => {
  const repo = await githubRepo.findRepoById(repoId);
  if (!repo) {
    const err = new Error('Repository not found');
    err.statusCode = 404;
    err.errorCode = 'REPO_NOT_FOUND';
    throw err;
  }

  return githubRepo.connectRepoToProject(repoId, projectId);
};

const disconnectRepository = async (userId, repoId) => {
  return githubRepo.disconnectRepo(repoId);
};

const getRepositoryCommits = async (userId, repoId, options) => {
  return githubRepo.findCommitsByRepo(repoId, options);
};

const getRepositoryPullRequests = async (userId, repoId, options) => {
  return githubRepo.findPRsByRepo(repoId, options);
};

const getRepositoryBranches = async (userId, repoId) => {
  const repo = await githubRepo.findRepoById(repoId);
  if (!repo) {
    const err = new Error('Repository not found');
    err.statusCode = 404;
    err.errorCode = 'REPO_NOT_FOUND';
    throw err;
  }

  const account = await githubRepo.findAccountByUserId(userId);
  if (!account) {
    return [];
  }

  const [owner, name] = repo.fullName.split('/');
  return githubIntegration.getRepositoryBranches(account.accessToken, owner, name);
};

module.exports = {
  getUserRepositories,
  connectRepository,
  disconnectRepository,
  getRepositoryCommits,
  getRepositoryPullRequests,
  getRepositoryBranches,
};
