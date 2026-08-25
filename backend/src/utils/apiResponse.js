/**
 * Standard API response helpers.
 * All responses follow the shape:
 *   { success: true, data: {} }
 *   { success: false, message: '', errorCode: '' }
 */

const successResponse = (res, data = null, statusCode = 200, message = null) => {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

const errorResponse = (
  res,
  message = 'An error occurred',
  statusCode = 400,
  errorCode = null
) => {
  const body = { success: false, message };
  if (errorCode) body.errorCode = errorCode;
  return res.status(statusCode).json(body);
};

const paginatedResponse = (res, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination,
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
