const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('./env');
const logger = require('../utils/logger');

let poolConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
};

// Fallback to parsing DATABASE_URL if host isn't explicit
if (config.database.url && !process.env.DB_HOST) {
  try {
    const parsed = new URL(config.database.url);
    poolConfig.host = parsed.hostname;
    poolConfig.port = parseInt(parsed.port, 10) || 3306;
    poolConfig.user = parsed.username;
    poolConfig.password = parsed.password;
    poolConfig.database = parsed.pathname.replace('/', '');
  } catch (err) {
    logger.warn('Failed to parse DATABASE_URL, using default pool config');
  }
}

const pool = mysql.createPool(poolConfig);

/**
 * Initializes DB tables from schema.sql if they do not exist
 */
const initializeSchema = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
    logger.info('MySQL database tables initialized successfully');
  } catch (err) {
    logger.error('Failed to initialize MySQL schema', { error: err.message });
  }
};

module.exports = { pool, initializeSchema };
