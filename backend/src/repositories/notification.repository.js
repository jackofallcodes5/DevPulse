const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const mapNotification = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    read: Boolean(row.is_read),
    createdAt: row.created_at,
  };
};

const findByUser = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`,
    [userId]
  );
  return rows.map(mapNotification);
};

const getUnreadCount = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return rows[0].count;
};

const create = async (data) => {
  const id = uuidv4();
  const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;
  await pool.execute(
    `INSERT INTO notifications (id, user_id, type, title, message, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.userId, data.type, data.title, data.message, metadataJson]
  );
  const [rows] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [id]);
  return mapNotification(rows[0]);
};

const markRead = async (id, userId) => {
  await pool.execute(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  const [rows] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [id]);
  return mapNotification(rows[0]);
};

const markAllRead = async (userId) => {
  await pool.execute(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return { success: true };
};

const createMany = async (notifications) => {
  for (const n of notifications) {
    await create(n);
  }
};

module.exports = {
  findByUser,
  getUnreadCount,
  create,
  markRead,
  markAllRead,
  createMany,
};
