const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const createAuditLog = async ({ userId, action, resource, resourceId, metadata, ipAddress }) => {
  try {
    const id = uuidv4();
    const metadataJson = metadata ? JSON.stringify(metadata) : null;

    await pool.execute(
      `INSERT INTO audit_logs (id, user_id, action, resource, resource_id, metadata, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId || null, action, resource, resourceId || null, metadataJson, ipAddress || null]
    );
  } catch (err) {
    logger.error('Failed to create audit log', { error: err.message, action, resource });
  }
};

const auditMiddleware = (action, resource) => {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        createAuditLog({
          userId: req.user?.id,
          action,
          resource,
          resourceId: req.params?.id || req.params?.workspaceId || req.params?.projectId,
          metadata: { method: req.method, path: req.path, statusCode: res.statusCode },
          ipAddress: req.ip,
        });
      }
    });
    return next();
  };
};

module.exports = { createAuditLog, auditMiddleware };
