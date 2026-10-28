
const jwt = require("jsonwebtoken");

/**
 * Middleware: Verify JWT Bearer Token
 * Extracts token from Authorization header and attaches decoded user to req.user
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token required.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token || token.trim() === "" || token === "null" || token === "undefined") {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token required.",
      });
    }

    const secret = process.env.JWT_SECRET || "expense_tracker_jwt_secret_key_2026";
    const decoded = jwt.verify(token, secret);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Middleware: Admin Role Authorization
 * Restricts access strictly to users having role: 'admin'
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }

  next();
};

module.exports = { verifyToken, adminOnly };

