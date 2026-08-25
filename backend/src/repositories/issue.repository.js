const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const mapIssue = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    projectId: row.project_id,
    reporterId: row.reporter_id,
    assigneeId: row.assignee_id,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reporter: row.rep_id ? { id: row.rep_id, name: row.rep_name, username: row.rep_username, avatarUrl: row.rep_avatar } : null,
    assignee: row.ass_id ? { id: row.ass_id, name: row.ass_name, username: row.ass_username, avatarUrl: row.ass_avatar } : null,
    _count: {
      comments: row.comment_count || 0,
      commits: row.commit_count || 0,
    },
  };
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT i.*,
       r.id as rep_id, r.name as rep_name, r.username as rep_username, r.avatar_url as rep_avatar,
       a.id as ass_id, a.name as ass_name, a.username as ass_username, a.avatar_url as ass_avatar,
       (SELECT COUNT(*) FROM comments c WHERE c.issue_id = i.id) as comment_count,
       (SELECT COUNT(*) FROM github_commits gc WHERE gc.issue_id = i.id) as commit_count
     FROM issues i
     LEFT JOIN users r ON i.reporter_id = r.id
     LEFT JOIN users a ON i.assignee_id = a.id
     WHERE i.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const issue = mapIssue(rows[0]);

  // Labels
  const [labels] = await pool.execute('SELECT id, label FROM issue_labels WHERE issue_id = ?', [id]);
  issue.labels = labels;

  // Comments
  const [comments] = await pool.execute(
    `SELECT c.*, u.name as author_name, u.username as author_username, u.avatar_url as author_avatar
     FROM comments c JOIN users u ON c.author_id = u.id WHERE c.issue_id = ? ORDER BY c.created_at ASC`,
    [id]
  );
  issue.comments = comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    author: { id: c.author_id, name: c.author_name, username: c.author_username, avatarUrl: c.author_avatar },
  }));

  // Commits
  const [commits] = await pool.execute(
    `SELECT gc.*, gr.name as repo_name, gr.full_name as repo_fullName
     FROM github_commits gc JOIN github_repositories gr ON gc.repository_id = gr.id
     WHERE gc.issue_id = ? ORDER BY gc.pushed_at DESC LIMIT 20`,
    [id]
  );
  issue.commits = commits.map((c) => ({
    id: c.id,
    sha: c.sha,
    message: c.message,
    authorName: c.author_name,
    url: c.url,
    repository: { name: c.repo_name, fullName: c.repo_fullName },
  }));

  return issue;
};

const findByProject = async (projectId, filters = {}) => {
  const {
    status,
    priority,
    assigneeId,
    search,
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters;

  let whereClauses = ['i.project_id = ?'];
  let values = [projectId];

  if (status) {
    whereClauses.push('i.status = ?');
    values.push(status);
  }
  if (priority) {
    whereClauses.push('i.priority = ?');
    values.push(priority);
  }
  if (assigneeId) {
    whereClauses.push('i.assignee_id = ?');
    values.push(assigneeId);
  }
  if (search) {
    whereClauses.push('i.title LIKE ?');
    values.push(`%${search}%`);
  }

  const whereSql = whereClauses.join(' AND ');

  const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM issues i WHERE ${whereSql}`, values);
  const total = countRows[0].total;

  const validSortColumns = ['created_at', 'updated_at', 'priority', 'status', 'number'];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;

  const [rows] = await pool.execute(
    `SELECT i.*,
       r.id as rep_id, r.name as rep_name, r.username as rep_username, r.avatar_url as rep_avatar,
       a.id as ass_id, a.name as ass_name, a.username as ass_username, a.avatar_url as ass_avatar,
       (SELECT COUNT(*) FROM comments c WHERE c.issue_id = i.id) as comment_count,
       (SELECT COUNT(*) FROM github_commits gc WHERE gc.issue_id = i.id) as commit_count
     FROM issues i
     LEFT JOIN users r ON i.reporter_id = r.id
     LEFT JOIN users a ON i.assignee_id = a.id
     WHERE ${whereSql}
     ORDER BY i.${sortCol} ${orderDir}
     LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`,
    values
  );

  return {
    issues: rows.map(mapIssue),
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
};

const getNextIssueNumber = async (projectId) => {
  const [rows] = await pool.execute(
    'SELECT MAX(number) as max_num FROM issues WHERE project_id = ?',
    [projectId]
  );
  return (rows[0].max_num || 0) + 1;
};

const create = async (projectId, data, reporterId) => {
  const id = uuidv4();
  const number = await getNextIssueNumber(projectId);

  await pool.execute(
    `INSERT INTO issues (id, number, title, description, status, priority, project_id, reporter_id, assignee_id, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      number,
      data.title,
      data.description || null,
      data.status || 'TODO',
      data.priority || 'MEDIUM',
      projectId,
      reporterId,
      data.assigneeId || null,
      data.dueDate ? new Date(data.dueDate) : null,
    ]
  );

  if (data.labels && data.labels.length > 0) {
    for (const label of data.labels) {
      await pool.execute(
        'INSERT INTO issue_labels (id, issue_id, label) VALUES (?, ?, ?)',
        [uuidv4(), id, label]
      );
    }
  }

  return findById(id);
};

const update = async (id, data) => {
  const updates = [];
  const values = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }
  if (data.priority !== undefined) {
    updates.push('priority = ?');
    values.push(data.priority);
  }
  if (data.assigneeId !== undefined) {
    updates.push('assignee_id = ?');
    values.push(data.assigneeId);
  }
  if (data.dueDate !== undefined) {
    updates.push('due_date = ?');
    values.push(data.dueDate ? new Date(data.dueDate) : null);
  }

  if (updates.length > 0) {
    values.push(id);
    await pool.execute(`UPDATE issues SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  if (data.labels !== undefined) {
    await pool.execute('DELETE FROM issue_labels WHERE issue_id = ?', [id]);
    for (const label of data.labels) {
      await pool.execute(
        'INSERT INTO issue_labels (id, issue_id, label) VALUES (?, ?, ?)',
        [uuidv4(), id, label]
      );
    }
  }

  return findById(id);
};

const remove = async (id) => {
  await pool.execute('DELETE FROM issues WHERE id = ?', [id]);
  return { success: true };
};

const findByProjectAndNumber = async (projectId, number) => {
  const [rows] = await pool.execute(
    'SELECT id FROM issues WHERE project_id = ? AND number = ?',
    [projectId, number]
  );
  if (rows.length === 0) return null;
  return findById(rows[0].id);
};

const getKanbanByProject = async (projectId) => {
  const res = await findByProject(projectId, { limit: 500 });
  const issues = res.issues;

  return {
    TODO: issues.filter((i) => i.status === 'TODO'),
    IN_PROGRESS: issues.filter((i) => i.status === 'IN_PROGRESS'),
    REVIEW: issues.filter((i) => i.status === 'REVIEW'),
    DONE: issues.filter((i) => i.status === 'DONE'),
  };
};

module.exports = {
  findById,
  findByProject,
  create,
  update,
  remove,
  findByProjectAndNumber,
  getKanbanByProject,
};
