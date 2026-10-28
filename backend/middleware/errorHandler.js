/**
 * Centralized Error Handling Middlewares for Expense Tracker
 */

// Handle requests for unknown routes (404)
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

// Centralized error handler for all unhandled errors
const errorHandler = (err, req, res, next) => {
  // Log error internally for debugging
  console.error(`[Error] ${req.method} ${req.url} ->`, err.message);

  // 1. JSON Syntax Error (malformed JSON body)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload in request body",
    });
  }

  // 2. Mongoose Invalid ObjectId (CastError)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format for parameter '${err.path}'`,
    });
  }

  // 3. Mongoose Schema Validation Error
  if (err.name === "ValidationError") {
    const errorDetails = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: "Database validation error",
      errors: errorDetails,
    });
  }

  // 4. Rate limit error (if thrown)
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }

  // 5. Default internal server error
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

