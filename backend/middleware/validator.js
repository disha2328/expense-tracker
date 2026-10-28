const { body, param, validationResult } = require("express-validator");

/**
 * Middleware to check validation results and return formatted 400 Bad Request if invalid
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Input validation failed",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validation rules for creating a new expense
 */
const validateExpenseCreate = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Expense title is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Title must be between 2 and 100 characters")
    .escape(),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number greater than 0")
    .toFloat(),

  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters")
    .escape(),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date format (YYYY-MM-DD)")
    .toDate(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage("Description cannot exceed 250 characters")
    .escape(),

  handleValidationErrors,
];

/**
 * Validation rules for updating an existing expense
 */
const validateExpenseUpdate = [
  param("id")
    .isMongoId()
    .withMessage("Invalid expense ID format. Must be a valid MongoDB ObjectId"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Title must be between 2 and 100 characters")
    .escape(),

  body("amount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number greater than 0")
    .toFloat(),

  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters")
    .escape(),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date format (YYYY-MM-DD)")
    .toDate(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage("Description cannot exceed 250 characters")
    .escape(),

  handleValidationErrors,
];

/**
 * Validation rule for MongoDB ObjectId in URL params
 */
const validateExpenseId = [
  param("id")
    .isMongoId()
    .withMessage("Invalid expense ID format. Must be a valid MongoDB ObjectId"),

  handleValidationErrors,
];

module.exports = {
  validateExpenseCreate,
  validateExpenseUpdate,
  validateExpenseId,
  handleValidationErrors,
};

