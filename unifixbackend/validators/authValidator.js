const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const signupValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').notEmpty().withMessage('Role is required'),
  handleValidation,
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  handleValidation,
];

const updateProfileValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
  handleValidation,
];

const reportSecurityValidator = [
  body('issueType').notEmpty().withMessage('Issue type is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  handleValidation,
];

const idCardUpdateValidator = [
  body('newIdCardUrl').notEmpty().withMessage('New ID card URL is required'),
  handleValidation,
];

module.exports = {
  signupValidator,
  loginValidator,
  changePasswordValidator,
  updateProfileValidator,
  reportSecurityValidator,
  idCardUpdateValidator,
};