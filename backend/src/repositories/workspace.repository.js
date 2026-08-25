const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const mapWorkspace = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    _count: {
      members: row.member_count || 0,
      projects: row.project_count || 0,
    },
  };
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT w.*,
       (SELECT COUNT(*) FROM workspace_members wm WHERE wm.workspace_id = w.id) as member_count,
       (SELECT COUNT(*) FROM projects p WHERE p.workspace_id = w.id) as project_count
     FROM workspaces w
     WHERE w.id = ?`,
    [id]
  );
  return mapWorkspace(rows[0]);
};

const findBySlug = async (slug) => {
  const [rows] = await pool.execute('SELECT * FROM workspaces WHERE slug = ?', [slug]);
  return mapWorkspace(rows[0]);
};

const findByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT w.*,
       (SELECT COUNT(*) FROM workspace_members wm WHERE wm.workspace_id = w.id) as member_count,
       (SELECT COUNT(*) FROM projects p WHERE p.workspace_id = w.id) as project_count
     FROM workspaces w
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return rows.map(mapWorkspace);
};

const create = async (data) => {
  const workspaceId = uuidv4();
  const memberId = uuidv4();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO workspaces (id, name, slug, owner_id) VALUES (?, ?, ?, ?)`,
      [workspaceId, data.name, data.slug, data.ownerId]
    );

    await conn.execute(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, 'OWNER')`,
      [memberId, workspaceId, data.ownerId]
    );

    await conn.commit();
    return findById(workspaceId);
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
  if (data.slug !== undefined) {
    updates.push('slug = ?');
    values.push(data.slug);
  }

  if (updates.length > 0) {
    values.push(id);
    await pool.execute(`UPDATE workspaces SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  return findById(id);
};

const remove = async (id) => {
  await pool.execute('DELETE FROM workspaces WHERE id = ?', [id]);
  return { success: true };
};

const findMembers = async (workspaceId) => {
  const [rows] = await pool.execute(
    `SELECT wm.id, wm.role, wm.joined_at, u.id as user_id, u.name, u.username, u.avatar_url, u.email
     FROM workspace_members wm
     JOIN users u ON wm.user_id = u.id
     WHERE wm.workspace_id = ?
     ORDER BY wm.joined_at ASC`,
    [workspaceId]
  );

  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    joinedAt: r.joined_at,
    user: {
      id: r.user_id,
      name: r.name,
      username: r.username,
      avatarUrl: r.avatar_url,
      email: r.email,
    },
  }));
};

const findMember = async (workspaceId, userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId]
  );
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    workspaceId: rows[0].workspace_id,
    userId: rows[0].user_id,
    role: rows[0].role,
    joinedAt: rows[0].joined_at,
  };
};

const addMember = async (workspaceId, userId, role = 'DEVELOPER') => {
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, ?)`,
    [id, workspaceId, userId, role]
  );
  const [rows] = await pool.execute(
    `SELECT wm.id, wm.role, wm.joined_at, u.id as user_id, u.name, u.username, u.avatar_url, u.email
     FROM workspace_members wm JOIN users u ON wm.user_id = u.id WHERE wm.id = ?`,
    [id]
  );
  return {
    id: rows[0].id,
    role: rows[0].role,
    joinedAt: rows[0].joined_at,
    user: { id: rows[0].user_id, name: rows[0].name, username: rows[0].username, avatarUrl: rows[0].avatar_url, email: rows[0].email },
  };
};

const updateMemberRole = async (workspaceId, userId, role) => {
  await pool.execute(
    'UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?',
    [role, workspaceId, userId]
  );
  return findMember(workspaceId, userId);
};

const removeMember = async (workspaceId, userId) => {
  await pool.execute(
    'DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId]
  );
  return { success: true };
};

module.exports = {
  findById,
  findBySlug,
  findByUserId,
  create,
  update,
  remove,
  findMembers,
  findMember,
  addMember,
  updateMemberRole,
  removeMember,
};
