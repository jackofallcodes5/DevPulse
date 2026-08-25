const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const mapActivity = (r) => {
  if (!r) return null;
  return {
    id: r.id,
    projectId: r.project_id,
    workspaceId: r.workspace_id,
    userId: r.user_id,
    type: r.type,
    payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
    createdAt: r.created_at,
    user: r.user_id ? { id: r.user_id, name: r.user_name, username: r.user_username, avatarUrl: r.user_avatar } : null,
  };
};

const create = async (data) => {
  const id = uuidv4();
  const payloadJson = JSON.stringify(data.payload || {});

  await pool.execute(
    `INSERT INTO activities (id, project_id, workspace_id, user_id, type, payload) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.projectId || null, data.workspaceId || null, data.userId || null, data.type, payloadJson]
  );

  const [rows] = await pool.execute(
    `SELECT a.*, u.name as user_name, u.username as user_username, u.avatar_url as user_avatar
     FROM activities a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = ?`,
    [id]
  );
  return mapActivity(rows[0]);
};

const findByProject = async (projectId, limit = 50) => {
  const [rows] = await pool.execute(
    `SELECT a.*, u.name as user_name, u.username as user_username, u.avatar_url as user_avatar
     FROM activities a LEFT JOIN users u ON a.user_id = u.id
     WHERE a.project_id = ? ORDER BY a.created_at DESC LIMIT ${parseInt(limit, 10)}`,
    [projectId]
  );
  return rows.map(mapActivity);
};

const findByWorkspace = async (workspaceId, limit = 50) => {
  const [rows] = await pool.execute(
    `SELECT a.*, u.name as user_name, u.username as user_username, u.avatar_url as user_avatar
     FROM activities a LEFT JOIN users u ON a.user_id = u.id
     WHERE a.workspace_id = ? ORDER BY a.created_at DESC LIMIT ${parseInt(limit, 10)}`,
    [workspaceId]
  );
  return rows.map(mapActivity);
};

module.exports = { create, findByProject, findByWorkspace };
