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
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.isOperational = true;
    // Attach detailed messages for debugging (optional)
    error.details = result.error.errors.map((e) => e.message);
    return next(error);
  }
  // Replace request data with parsed (and possibly coerced) values
  req.body = result.data.body;
  req.query = result.data.query;
  req.params = result.data.params;
  return next();
};

export default validate;
