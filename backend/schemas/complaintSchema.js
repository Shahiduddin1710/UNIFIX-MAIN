const Joi = require('joi');

const submitComplaintSchema = Joi.object({
  category: Joi.string()
    .valid('electrical', 'plumbing', 'carpentry', 'cleaning', 'technician', 'safety', 'washroom', 'housekeeping', 'civil', 'it / technical', 'lab', 'others')
    .required(),
  subIssue: Joi.string().max(200).allow('', null),
  customIssue: Joi.string().max(200).allow('', null),
  description: Joi.string().max(1000).allow('', null),
  building: Joi.string().max(200).required(),
  roomDetail: Joi.string().max(200).allow('', null),
  photoUrl: Joi.string().uri().allow('', null),
});

const acceptComplaintSchema = Joi.object({
  complaintId: Joi.string().required(),
});

const updateStatusSchema = Joi.object({
  complaintId: Joi.string().required(),
  status: Joi.string().valid('in_progress', 'completed').required(),
});

const rejectComplaintSchema = Joi.object({
  complaintId: Joi.string().required(),
  reason: Joi.string().min(5).max(500).required(),
});

const rateComplaintSchema = Joi.object({
  complaintId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(500).allow('', null),
});

module.exports = {
  submitComplaintSchema,
  acceptComplaintSchema,
  updateStatusSchema,
  rejectComplaintSchema,
  rateComplaintSchema,
};