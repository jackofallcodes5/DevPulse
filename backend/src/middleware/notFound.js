const { errorResponse } = require('../utils/apiResponse');

const notFound = (req, res) => {
  return errorResponse(
    res,
    `Route ${req.method} ${req.path} not found`,
    404,
    'NOT_FOUND'
  );
};

module.exports = notFound;
