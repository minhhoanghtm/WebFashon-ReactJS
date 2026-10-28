import { ZodError } from 'zod';

/**
 * validate - Express middleware to validate request data using a Zod schema.
 * The schema should be built for the entire request (body, query, params).
 */
const validate = (schema) => (req, res, next) => {
  const data = {
    body: req.body,
    query: req.query,
    params: req.params,
  };
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new Error('Dữ liệu không hợp lệ (Validation failed)');
    error.statusCode = 400;
    error.isOperational = true;
    const issues = result.error.issues ?? result.error.errors ?? [];
    error.details = issues.map((e) => {
      const pathStr = e.path && e.path.length > 0 ? e.path.join(".") + ": " : "";
      return `${pathStr}${e.message}`;
    });
    return next(error);
  }
  // Replace request data with parsed (and possibly coerced) values
  req.body = result.data.body;
  req.query = result.data.query;
  req.params = result.data.params;
  return next();
};

export default validate;
