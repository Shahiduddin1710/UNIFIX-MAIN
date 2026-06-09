const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const submitComplaintValidator = [
  body('category').notEmpty().withMessage('Category is required'),
  body('building').notEmpty().withMessage('Building is required'),
  handleValidation,
];

const rateComplaintValidator = [
  body('complaintId').notEmpty().withMessage('Complaint ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  handleValidation,
];

const postLostFoundValidator = [
  body('itemName').trim().notEmpty().withMessage('Item name is required'),
  body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
  body('collectLocation').trim().notEmpty().withMessage('Collect location is required'),
  handleValidation,
];

module.exports = {
  submitComplaintValidator,
  rateComplaintValidator,
  postLostFoundValidator,
};