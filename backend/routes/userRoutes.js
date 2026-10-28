const express = require("express");
const { body } = require("express-validator");
const {
  registerUser,
  loginUser,
  getProfile,
} = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const { handleValidationErrors } = require("../middleware/validator");

const router = express.Router();

// Registration route with input validation
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Enter valid email").normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must contain at least 6 characters"),
    handleValidationErrors,
  ],
  registerUser
);

// Login route with input validation
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Enter valid email").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],
  loginUser
);

// Protected profile route
router.get("/profile", protect, getProfile);

module.exports = router;

