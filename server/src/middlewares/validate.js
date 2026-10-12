/**
 * Generic Joi validation middleware factory.
 * Validates req.body against the provided Joi schema.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data.',
        details: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/"/g, ''),
        })),
      },
    });
  }

  // Replace req.body with the validated/sanitized value
  req.body = value;
  next();
};

module.exports = validate;
