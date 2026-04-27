const Joi = require('joi');

const signupSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('student', 'teacher', 'staff').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  fullName: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('student', 'teacher', 'staff').required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const verifyResetOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).max(100).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required(),
});

const savePushTokenSchema = Joi.object({
  expoPushToken: Joi.string().pattern(/^ExponentPushToken/).required(),
});

module.exports = {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  changePasswordSchema,
  savePushTokenSchema,
};