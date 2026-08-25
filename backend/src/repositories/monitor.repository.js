const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const mapMonitor = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    method: row.method,
    expectedStatus: row.expected_status,
    intervalMinutes: row.interval_minutes,
    timeoutSeconds: row.timeout_seconds,
    active: Boolean(row.active),
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    project: row.project_name ? { id: row.project_id, name: row.project_name } : null,
    workspace: row.workspace_name ? { id: row.workspace_id, name: row.workspace_name } : null,
    _count: {
      checks: row.check_count || 0,
      incidents: row.incident_count || 0,
    },
  };
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT m.*, p.name as project_name, w.name as workspace_name,
       (SELECT COUNT(*) FROM monitor_checks mc WHERE mc.monitor_id = m.id) as check_count,
       (SELECT COUNT(*) FROM incidents inc WHERE inc.monitor_id = m.id) as incident_count
     FROM monitors m
     LEFT JOIN projects p ON m.project_id = p.id
     LEFT JOIN workspaces w ON m.workspace_id = w.id
     WHERE m.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const monitor = mapMonitor(rows[0]);

  // Fetch recent checks
  const [checks] = await pool.execute(
    'SELECT * FROM monitor_checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 5',
    [id]
  );
  monitor.checks = checks.map((c) => ({
    id: c.id,
    success: Boolean(c.success),
    statusCode: c.status_code,
    responseTimeMs: c.response_time_ms,
    checkedAt: c.checked_at,
  }));

  return monitor;
};

const findByWorkspace = async (workspaceId) => {
  const [rows] = await pool.execute(
    `SELECT m.*, p.name as project_name, w.name as workspace_name
     FROM monitors m
     LEFT JOIN projects p ON m.project_id = p.id
     LEFT JOIN workspaces w ON m.workspace_id = w.id
     WHERE m.workspace_id = ? ORDER BY m.created_at DESC`,
    [workspaceId]
  );

  const monitors = [];
  for (const r of rows) {
    const monitor = mapMonitor(r);
    const [checks] = await pool.execute(
      'SELECT * FROM monitor_checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 1',
      [r.id]
    );
    monitor.checks = checks.map((c) => ({
      id: c.id,
      success: Boolean(c.success),
      statusCode: c.status_code,
      responseTimeMs: c.response_time_ms,
      checkedAt: c.checked_at,
    }));
    monitors.push(monitor);
  }

  return monitors;
};

const findByProject = async (projectId) => {
  const [rows] = await pool.execute(
    `SELECT m.*, p.name as project_name, w.name as workspace_name
     FROM monitors m
     LEFT JOIN projects p ON m.project_id = p.id
     LEFT JOIN workspaces w ON m.workspace_id = w.id
     WHERE m.project_id = ? ORDER BY m.created_at DESC`,
    [projectId]
  );
  return rows.map(mapMonitor);
};

const findActive = async () => {
  const [rows] = await pool.execute('SELECT * FROM monitors WHERE active = 1');
  return rows.map(mapMonitor);
};

const create = async (data) => {
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO monitors (id, name, url, method, expected_status, interval_minutes, timeout_seconds, active, workspace_id, project_id, created_by_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.url,
      data.method || 'GET',
      data.expectedStatus || 200,
      data.intervalMinutes || 5,
      data.timeoutSeconds || 30,
      data.active !== undefined ? (data.active ? 1 : 0) : 1,
      data.workspaceId,
      data.projectId || null,
      data.createdById,
    ]
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
  if (data.url !== undefined) {
    updates.push('url = ?');
    values.push(data.url);
  }
  if (data.method !== undefined) {
    updates.push('method = ?');
    values.push(data.method);
  }
  if (data.expectedStatus !== undefined) {
    updates.push('expected_status = ?');
    values.push(data.expectedStatus);
  }
  if (data.intervalMinutes !== undefined) {
    updates.push('interval_minutes = ?');
    values.push(data.intervalMinutes);
  }
  if (data.timeoutSeconds !== undefined) {
    updates.push('timeout_seconds = ?');
    values.push(data.timeoutSeconds);
  }
  if (data.active !== undefined) {
    updates.push('active = ?');
    values.push(data.active ? 1 : 0);
  }

  if (updates.length > 0) {
    values.push(id);
    await pool.execute(`UPDATE monitors SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  return findById(id);
};

const remove = async (id) => {
  await pool.execute('DELETE FROM monitors WHERE id = ?', [id]);
  return { success: true };
};

const recordCheck = async (monitorId, checkData) => {
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO monitor_checks (id, monitor_id, success, status_code, response_time_ms, error, checked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      monitorId,
      checkData.success ? 1 : 0,
      checkData.statusCode || null,
      checkData.responseTimeMs || null,
      checkData.error || null,
      checkData.checkedAt || new Date(),
    ]
  );
  return { id, monitorId, success: checkData.success, responseTimeMs: checkData.responseTimeMs };
};

const getChecks = async (monitorId, limit = 100) => {
  const [rows] = await pool.execute(
    `SELECT * FROM monitor_checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT ${parseInt(limit, 10)}`,
    [monitorId]
  );
  return rows.map((c) => ({
    id: c.id,
    success: Boolean(c.success),
    statusCode: c.status_code,
    responseTimeMs: c.response_time_ms,
    error: c.error,
    checkedAt: c.checked_at,
  }));
};

const findOpenIncident = async (monitorId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM incidents WHERE monitor_id = ? AND status = 'OPEN' ORDER BY started_at DESC LIMIT 1`,
    [monitorId]
  );
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    monitorId: rows[0].monitor_id,
    status: rows[0].status,
    reason: rows[0].reason,
    startedAt: rows[0].started_at,
  };
};

const createIncident = async (monitorId, reason) => {
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO incidents (id, monitor_id, status, reason, started_at) VALUES (?, ?, 'OPEN', ?, NOW())`,
    [id, monitorId, reason || null]
  );
  return { id, monitorId, status: 'OPEN', reason, startedAt: new Date() };
};

const resolveIncident = async (incidentId) => {
  await pool.execute(
    `UPDATE incidents SET status = 'RESOLVED', resolved_at = NOW() WHERE id = ?`,
    [incidentId]
  );
  const [rows] = await pool.execute('SELECT * FROM incidents WHERE id = ?', [incidentId]);
  return {
    id: rows[0].id,
    monitorId: rows[0].monitor_id,
    status: 'RESOLVED',
    resolvedAt: rows[0].resolved_at,
  };
};

const getIncidents = async (monitorId, limit = 50) => {
  const [rows] = await pool.execute(
    `SELECT * FROM incidents WHERE monitor_id = ? ORDER BY started_at DESC LIMIT ${parseInt(limit, 10)}`,
    [monitorId]
  );
  return rows.map((i) => ({
    id: i.id,
    status: i.status,
    reason: i.reason,
    startedAt: i.started_at,
    resolvedAt: i.resolved_at,
  }));
};

module.exports = {
  findById,
  findByWorkspace,
  findByProject,
  findActive,
  create,
  update,
  remove,
  recordCheck,
  getChecks,
  findOpenIncident,
  createIncident,
  resolveIncident,
  getIncidents,
};
