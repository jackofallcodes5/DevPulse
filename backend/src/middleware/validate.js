/**
 * Zod-based request validation middleware.
 * Usage: router.post('/', validate({ body: schema }), controller)
 */
const validate = (schemas) => {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      return next();
    } catch (err) {
      // Pass ZodError to centralized error handler
      return next(err);
    }
  };
};

module.exports = { validate };
