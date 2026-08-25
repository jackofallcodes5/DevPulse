const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// ── GitHub Account ────────────────────────────────────────

const findAccountByUserId = async (userId) => {
  const [rows] = await pool.execute('SELECT * FROM github_accounts WHERE user_id = ?', [userId]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    githubId: r.github_id,
    login: r.login,
    name: r.name,
    avatarUrl: r.avatar_url,
    accessToken: r.access_token,
    tokenScope: r.token_scope,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
};

const findAccountByGithubId = async (githubId) => {
  const [rows] = await pool.execute('SELECT * FROM github_accounts WHERE github_id = ?', [String(githubId)]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    githubId: r.github_id,
    login: r.login,
    name: r.name,
    avatarUrl: r.avatar_url,
    accessToken: r.access_token,
    tokenScope: r.token_scope,
  };
};

const upsertAccount = async (userId, githubData) => {
  const existing = await findAccountByUserId(userId);
  if (existing) {
    await pool.execute(
      `UPDATE github_accounts
       SET login = ?, name = ?, avatar_url = ?, access_token = ?, token_scope = ?
       WHERE user_id = ?`,
      [
        githubData.login,
        githubData.name || null,
        githubData.avatarUrl || null,
        githubData.accessToken,
        githubData.tokenScope || null,
        userId,
      ]
    );
    return findAccountByUserId(userId);
  }

  const id = uuidv4();
  await pool.execute(
    `INSERT INTO github_accounts (id, user_id, github_id, login, name, avatar_url, access_token, token_scope)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      String(githubData.githubId),
      githubData.login,
      githubData.name || null,
      githubData.avatarUrl || null,
      githubData.accessToken,
      githubData.tokenScope || null,
    ]
  );
  return findAccountByUserId(userId);
};

const deleteAccount = async (userId) => {
  await pool.execute('DELETE FROM github_accounts WHERE user_id = ?', [userId]);
  return { success: true };
};

// ── GitHub Repository ─────────────────────────────────────

const mapRepo = (r) => {
  if (!r) return null;
  return {
    id: r.id,
    githubId: r.github_id,
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    private: Boolean(r.is_private),
    url: r.url,
    cloneUrl: r.clone_url,
    defaultBranch: r.default_branch,
    projectId: r.project_id,
    githubAccountId: r.github_account_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    project: r.project_name ? { id: r.project_id, name: r.project_name } : null,
  };
};

const findReposByAccount = async (githubAccountId) => {
  const [rows] = await pool.execute(
    `SELECT gr.*, p.name as project_name
     FROM github_repositories gr
     LEFT JOIN projects p ON gr.project_id = p.id
     WHERE gr.github_account_id = ? ORDER BY gr.name ASC`,
    [githubAccountId]
  );
  return rows.map(mapRepo);
};

const findRepoById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM github_repositories WHERE id = ?', [id]);
  return mapRepo(rows[0]);
};

const findRepoByGithubId = async (githubId) => {
  const [rows] = await pool.execute('SELECT * FROM github_repositories WHERE github_id = ?', [githubId]);
  return mapRepo(rows[0]);
};

const findRepoByFullName = async (fullName) => {
  const [rows] = await pool.execute('SELECT * FROM github_repositories WHERE full_name = ?', [fullName]);
  return mapRepo(rows[0]);
};

const upsertRepo = async (githubAccountId, repoData) => {
  const existing = await findRepoByGithubId(repoData.githubId);
  if (existing) {
    await pool.execute(
      `UPDATE github_repositories
       SET name = ?, description = ?, url = ?, default_branch = ?
       WHERE github_id = ?`,
      [repoData.name, repoData.description || null, repoData.url, repoData.defaultBranch || 'main', repoData.githubId]
    );
    return findRepoByGithubId(repoData.githubId);
  }

  const id = uuidv4();
  await pool.execute(
    `INSERT INTO github_repositories (id, github_id, name, full_name, description, is_private, url, clone_url, default_branch, github_account_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      repoData.githubId,
      repoData.name,
      repoData.fullName,
      repoData.description || null,
      repoData.private ? 1 : 0,
      repoData.url,
      repoData.cloneUrl || null,
      repoData.defaultBranch || 'main',
      githubAccountId,
    ]
  );
  return findRepoById(id);
};

const connectRepoToProject = async (repoId, projectId) => {
  await pool.execute('UPDATE github_repositories SET project_id = ? WHERE id = ?', [projectId, repoId]);
  return findRepoById(repoId);
};

const disconnectRepo = async (id) => {
  await pool.execute('UPDATE github_repositories SET project_id = NULL WHERE id = ?', [id]);
  return { success: true };
};

// ── GitHub Commit ─────────────────────────────────────────

const upsertCommit = async (data) => {
  const [rows] = await pool.execute('SELECT id FROM github_commits WHERE sha = ?', [data.sha]);

  if (rows.length > 0) {
    await pool.execute(
      'UPDATE github_commits SET issue_id = ?, project_id = ? WHERE sha = ?',
      [data.issueId || null, data.projectId || null, data.sha]
    );
    const [updated] = await pool.execute('SELECT * FROM github_commits WHERE sha = ?', [data.sha]);
    return updated[0];
  }

  const id = uuidv4();
  await pool.execute(
    `INSERT INTO github_commits (id, sha, message, author_name, author_email, authored_at, url, repository_id, project_id, issue_id, pushed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.sha,
      data.message,
      data.authorName,
      data.authorEmail,
      data.authoredAt,
      data.url,
      data.repositoryId,
      data.projectId || null,
      data.issueId || null,
      data.pushedAt || new Date(),
    ]
  );

  const [inserted] = await pool.execute('SELECT * FROM github_commits WHERE id = ?', [id]);
  return inserted[0];
};

const findCommitsByRepo = async (repositoryId, { limit = 50, page = 1 } = {}) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT gc.*, i.id as issue_id, i.number as issue_number, i.title as issue_title
     FROM github_commits gc
     LEFT JOIN issues i ON gc.issue_id = i.id
     WHERE gc.repository_id = ?
     ORDER BY gc.pushed_at DESC LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`,
    [repositoryId]
  );

  return rows.map((c) => ({
    id: c.id,
    sha: c.sha,
    message: c.message,
    authorName: c.author_name,
    authorEmail: c.author_email,
    authoredAt: c.authored_at,
    url: c.url,
    pushedAt: c.pushed_at,
    issue: c.issue_id ? { id: c.issue_id, number: c.issue_number, title: c.issue_title } : null,
  }));
};

const findCommitsByIssue = async (issueId) => {
  const [rows] = await pool.execute(
    `SELECT gc.*, gr.id as repo_id, gr.name as repo_name, gr.full_name as repo_fullName
     FROM github_commits gc JOIN github_repositories gr ON gc.repository_id = gr.id
     WHERE gc.issue_id = ? ORDER BY gc.pushed_at DESC`,
    [issueId]
  );
  return rows.map((c) => ({
    id: c.id,
    sha: c.sha,
    message: c.message,
    authorName: c.author_name,
    url: c.url,
    repository: { id: c.repo_id, name: c.repo_name, fullName: c.repo_fullName },
  }));
};

// ── GitHub Pull Request ───────────────────────────────────

const upsertPullRequest = async (data) => {
  const [rows] = await pool.execute(
    'SELECT id FROM github_pull_requests WHERE repository_id = ? AND number = ?',
    [data.repositoryId, data.number]
  );

  if (rows.length > 0) {
    await pool.execute(
      `UPDATE github_pull_requests
       SET state = ?, title = ?, merged = ?, merged_at = ?, github_updated_at = ?
       WHERE id = ?`,
      [data.state, data.title, data.merged ? 1 : 0, data.mergedAt, data.githubUpdatedAt, rows[0].id]
    );
    const [updated] = await pool.execute('SELECT * FROM github_pull_requests WHERE id = ?', [rows[0].id]);
    return updated[0];
  }

  const id = uuidv4();
  await pool.execute(
    `INSERT INTO github_pull_requests (id, github_id, number, title, state, body, url, author_login, author_avatar_url, merged, merged_at, repository_id, project_id, github_created_at, github_updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.githubId,
      data.number,
      data.title,
      data.state,
      data.body || null,
      data.url,
      data.authorLogin,
      data.authorAvatarUrl || null,
      data.merged ? 1 : 0,
      data.mergedAt || null,
      data.repositoryId,
      data.projectId || null,
      data.githubCreatedAt,
      data.githubUpdatedAt,
    ]
  );

  const [inserted] = await pool.execute('SELECT * FROM github_pull_requests WHERE id = ?', [id]);
  return inserted[0];
};

const findPRsByRepo = async (repositoryId, { state, limit = 50, page = 1 } = {}) => {
  const offset = (page - 1) * limit;
  let sql = 'SELECT * FROM github_pull_requests WHERE repository_id = ?';
  const params = [repositoryId];

  if (state) {
    sql += ' AND state = ?';
    params.push(state);
  }

  sql += ` ORDER BY github_created_at DESC LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`;

  const [rows] = await pool.execute(sql, params);
  return rows.map((r) => ({
    id: r.id,
    githubId: r.github_id,
    number: r.number,
    title: r.title,
    state: r.state,
    url: r.url,
    authorLogin: r.author_login,
    authorAvatarUrl: r.author_avatar_url,
    merged: Boolean(r.merged),
    githubCreatedAt: r.github_created_at,
  }));
};

// ── GitHub Event ─────────────────────────────────────────

const findEventByDeliveryId = async (deliveryId) => {
  const [rows] = await pool.execute('SELECT * FROM github_events WHERE delivery_id = ?', [deliveryId]);
  return rows[0] || null;
};

const createEvent = async (data) => {
  const id = uuidv4();
  const payloadJson = JSON.stringify(data.payload);
  await pool.execute(
    `INSERT INTO github_events (id, delivery_id, event, action, repository_id, payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.deliveryId, data.event, data.action || null, data.repositoryId || null, payloadJson]
  );
  const [rows] = await pool.execute('SELECT * FROM github_events WHERE id = ?', [id]);
  return rows[0];
};

const markEventProcessed = async (id) => {
  await pool.execute('UPDATE github_events SET processed = 1, processed_at = NOW() WHERE id = ?', [id]);
  return { success: true };
};

module.exports = {
  findAccountByUserId,
  findAccountByGithubId,
  upsertAccount,
  deleteAccount,
  findReposByAccount,
  findRepoById,
  findRepoByGithubId,
  findRepoByFullName,
  upsertRepo,
  connectRepoToProject,
  disconnectRepo,
  upsertCommit,
  findCommitsByRepo,
  findCommitsByIssue,
  upsertPullRequest,
  findPRsByRepo,
  findEventByDeliveryId,
  createEvent,
  markEventProcessed,
};
