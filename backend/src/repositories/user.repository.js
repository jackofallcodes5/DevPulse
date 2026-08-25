const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    name: row.name,
    passwordHash: row.password_hash,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT u.*, g.id as gh_id, g.login as gh_login, g.avatar_url as gh_avatar
     FROM users u
     LEFT JOIN github_accounts g ON u.id = g.user_id
     WHERE u.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const user = mapUser(rows[0]);
  delete user.passwordHash;

  if (rows[0].gh_id) {
    user.githubAccount = {
      id: rows[0].gh_id,
      login: rows[0].gh_login,
      avatarUrl: rows[0].gh_avatar,
    };
  }
  return user;
};

const findByEmail = async (email) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return mapUser(rows[0]);
};

const findByUsername = async (username) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  return mapUser(rows[0]);
};

const findByIdWithPassword = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return mapUser(rows[0]);
};

const create = async (data) => {
  const id = uuidv4();
  const avatarUrl = data.avatarUrl || null;
  const passwordHash = data.passwordHash || null;

  await pool.execute(
    `INSERT INTO users (id, email, username, name, password_hash, avatar_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.email, data.username, data.name, passwordHash, avatarUrl]
  );

  return findById(id);
};

const update = async (id, data) => {
  const updates = [];
  const values = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.username !== undefined) {
    updates.push('username = ?');
    values.push(data.username);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    values.push(data.email);
  }
  if (data.avatarUrl !== undefined) {
    updates.push('avatar_url = ?');
    values.push(data.avatarUrl);
  }
  if (data.passwordHash !== undefined) {
    updates.push('password_hash = ?');
    values.push(data.passwordHash);
  }

  if (updates.length > 0) {
    values.push(id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  return findById(id);
};

const findMany = async () => {
  const [rows] = await pool.execute('SELECT id, email, username, name, avatar_url FROM users');
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    username: r.username,
    name: r.name,
    avatarUrl: r.avatar_url,
  }));
};

module.exports = {
  findById,
  findByEmail,
  findByUsername,
  findByIdWithPassword,
  create,
  update,
  findMany,
};
