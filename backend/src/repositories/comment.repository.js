const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const mapComment = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    body: row.body,
    issueId: row.issue_id,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_id,
      name: row.author_name,
      username: row.author_username,
      avatarUrl: row.author_avatar,
    },
  };
};

const findByIssue = async (issueId) => {
  const [rows] = await pool.execute(
    `SELECT c.*, u.name as author_name, u.username as author_username, u.avatar_url as author_avatar
     FROM comments c
     JOIN users u ON c.author_id = u.id
     WHERE c.issue_id = ?
     ORDER BY c.created_at ASC`,
    [issueId]
  );
  return rows.map(mapComment);
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT c.*, u.name as author_name, u.username as author_username, u.avatar_url as author_avatar
     FROM comments c
     JOIN users u ON c.author_id = u.id
     WHERE c.id = ?`,
    [id]
  );
  return mapComment(rows[0]);
};

const create = async (issueId, authorId, body) => {
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO comments (id, body, issue_id, author_id) VALUES (?, ?, ?, ?)`,
    [id, body, issueId, authorId]
  );
  return findById(id);
};

const update = async (id, body) => {
  await pool.execute('UPDATE comments SET body = ? WHERE id = ?', [body, id]);
  return findById(id);
};

const remove = async (id) => {
  await pool.execute('DELETE FROM comments WHERE id = ?', [id]);
  return { success: true };
};

module.exports = { findByIssue, findById, create, update, remove };
