
const express = require("express");
const router = express.Router();
const { verifyToken, adminOnly } = require("../middleware/jwtAuth");

/**
 * @route   GET /api/protected/user
 * @desc    Protected user dashboard (accessible to any authenticated user)
 * @access  Private (Valid JWT Token)
 */
router.get("/user", verifyToken, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Welcome to Expense Tracker!",
      user: req.user,
      access: "User Dashboard",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error accessing user route",
    });
  }
});

/**
 * @route   GET /api/protected/admin
 * @desc    Protected administrator dashboard (accessible ONLY to admin role)
 * @access  Private (Valid JWT Token + role === 'admin')
 */
router.get("/admin", verifyToken, adminOnly, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Welcome Admin!",
      user: req.user,
      access: "Admin Dashboard",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error accessing admin route",
    });
  }
});

module.exports = router;

