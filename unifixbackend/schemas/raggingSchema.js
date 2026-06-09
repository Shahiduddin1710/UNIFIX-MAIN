const Joi = require('joi');

const raggingSchema = Joi.object({
  incidentDate: Joi.string().required(),
  incidentTime: Joi.string().allow('', null),
  location: Joi.string().min(3).max(300).required(),
  description: Joi.string().min(30).max(2000).required(),
  bullyDescription: Joi.string().max(1000).allow('', null),
  isAnonymous: Joi.boolean().required(),
});

module.exports = { raggingSchema };