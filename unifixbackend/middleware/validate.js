const { sendError } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message).join(', ');
    return sendError(res, messages, 400);
  }
  next();
};

module.exports = validate;