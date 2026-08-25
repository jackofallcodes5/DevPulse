const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const mapProject = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    key: row.project_key,
    status: row.status,
    workspaceId: row.workspace_id,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    _count: {
      issues: row.issue_count || 0,
      members: row.member_count || 0,
    },
  };
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT p.*,
       (SELECT COUNT(*) FROM issues i WHERE i.project_id = p.id) as issue_count,
       (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
     FROM projects p
     WHERE p.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const project = mapProject(rows[0]);

  // Fetch repositories connected
  const [repos] = await pool.execute(
    'SELECT id, name, full_name as fullName, url FROM github_repositories WHERE project_id = ?',
    [id]
  );
  project.repositories = repos;

  return project;
};

const findByWorkspace = async (workspaceId) => {
  if (!workspaceId) return [];
  const [rows] = await pool.execute(
    `SELECT p.*,
       (SELECT COUNT(*) FROM issues i WHERE i.project_id = p.id) as issue_count,
       (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
     FROM projects p
     WHERE p.workspace_id = ?
     ORDER BY p.created_at DESC`,
    [workspaceId]
  );
  return rows.map(mapProject);
};

const create = async (data) => {
  const projectId = uuidv4();
  const memberId = uuidv4();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO projects (id, name, description, project_key, status, workspace_id, created_by_id)
       VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      [projectId, data.name, data.description || null, data.key, data.workspaceId, data.createdById]
    );

    await conn.execute(
      `INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, 'ADMIN')`,
      [memberId, projectId, data.createdById]
    );

    await conn.commit();
    return findById(projectId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const update = async (id, data) => {
  const updates = [];
  const values = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }

  if (updates.length > 0) {
    values.push(id);
    await pool.execute(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  return findById(id);
};

const remove = async (id) => {
  await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
  return { success: true };
};

const findMembers = async (projectId) => {
  const [rows] = await pool.execute(
    `SELECT pm.id, pm.role, pm.joined_at, u.id as user_id, u.name, u.username, u.avatar_url, u.email
     FROM project_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = ?`,
    [projectId]
  );
  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    joinedAt: r.joined_at,
    user: { id: r.user_id, name: r.name, username: r.username, avatarUrl: r.avatar_url, email: r.email },
  }));
};

const findMember = async (projectId, userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    projectId: rows[0].project_id,
    userId: rows[0].user_id,
    role: rows[0].role,
    joinedAt: rows[0].joined_at,
  };
};

const addMember = async (projectId, userId, role = 'DEVELOPER') => {
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [id, projectId, userId, role]
  );
  return findMember(projectId, userId);
};

const removeMember = async (projectId, userId) => {
  await pool.execute('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
  return { success: true };
};

const generateKey = async (workspaceId, name) => {
  let base = (name || 'PROJ')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  if (!base || base.length < 2) base = 'PROJ';

  let key = base;
  let counter = 1;

  while (true) {
    const [rows] = await pool.execute(
      'SELECT id FROM projects WHERE workspace_id = ? AND project_key = ?',
      [workspaceId, key]
    );
    if (rows.length === 0) return key;
    key = `${base.slice(0, 4)}${counter}`;
    counter++;
  }
};

module.exports = {
  findById,
  findByWorkspace,
  create,
  update,
  remove,
  findMembers,
  findMember,
  addMember,
  removeMember,
  generateKey,
};
