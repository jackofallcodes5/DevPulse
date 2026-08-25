const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../utils/logger');

const exchangeCodeForToken = async (code) => {
  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: config.github.clientId,
      client_secret: config.github.clientSecret,
      code,
      redirect_uri: config.github.callbackUrl,
    },
    {
      headers: { Accept: 'application/json' },
    }
  );
  return response.data;
};

const getGitHubUser = async (accessToken) => {
  const response = await axios.get('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  return response.data;
};

const getUserRepositories = async (accessToken) => {
  const response = await axios.get('https://api.github.com/user/repos', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    params: {
      sort: 'updated',
      per_page: 100,
    },
  });
  return response.data;
};

const getRepositoryCommits = async (accessToken, owner, repo) => {
  const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    params: { per_page: 50 },
  });
  return response.data;
};

const getRepositoryPullRequests = async (accessToken, owner, repo) => {
  const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    params: { state: 'all', per_page: 50 },
  });
  return response.data;
};

const getRepositoryBranches = async (accessToken, owner, repo) => {
  const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  return response.data;
};

const verifyWebhookSignature = (payloadBuffer, signatureHeader, secret) => {
  if (!signatureHeader || !secret) return false;
  try {
    const expectedSignature =
      'sha256=' +
      crypto
        .createHmac('sha256', secret)
        .update(payloadBuffer)
        .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    logger.error('Error verifying GitHub webhook signature', { error: err.message });
    return false;
  }
};

const parseIssueReferences = (commitMessage) => {
  if (!commitMessage) return [];
  // Match patterns like #142, fixes #142, fix #142, closes #142, resolves #142
  const regex = /(?:fix(?:es)?|close[sd]?|resolve[sd]?)?\s*#(\d+)/gi;
  const matches = new Set();
  let match;
  while ((match = regex.exec(commitMessage)) !== null) {
    matches.add(parseInt(match[1], 10));
  }
  return Array.from(matches);
};

module.exports = {
  exchangeCodeForToken,
  getGitHubUser,
  getUserRepositories,
  getRepositoryCommits,
  getRepositoryPullRequests,
  getRepositoryBranches,
  verifyWebhookSignature,
  parseIssueReferences,
};
