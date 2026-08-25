const { verifyAccessToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Extracts the JWT from either:
 *   1. Authorization: Bearer <token> header
 *   2. access_token HTTP-only cookie
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  return null;
};

/**
 * Required auth middleware — rejects unauthenticated requests.
 */
const authenticate = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return errorResponse(res, 'Authentication required', 401, 'UNAUTHENTICATED');
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    logger.debug('JWT verification failed', { error: err.message });
    return errorResponse(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
  }
};

/**
 * Optional auth — attaches user if token is present and valid, otherwise continues.
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
  } catch {
    // silently ignore invalid tokens for optional auth
  }
  return next();
};

module.exports = { authenticate, optionalAuth };
