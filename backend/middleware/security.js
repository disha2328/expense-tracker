const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

/**
 * 1. Helmet: Secure HTTP Headers
 * Hardens the API against common web vulnerabilities (XSS, Clickjacking, MIME sniffing, etc.)
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5173", "http://127.0.0.1:5173"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * 2. CORS: Cross-Origin Resource Sharing
 * Restricts access to trusted origins (React frontend) with authorized methods and headers
 */
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman) or trusted origins
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy: Access denied for this origin."));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400, // 24 hours
});

/**
 * 3. Rate Limiting: Prevent Brute Force & DoS attacks
 * Limits requests per IP within the configured window
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // Default: 15 minutes
  limit: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // Default: 100 requests per 15 minutes
  standardHeaders: "draft-8",
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  },
});

/**
 * 4. NoSQL Injection Protection
 * Strips MongoDB operators ($ and .) from request body, query parameters, and params
 */
const noSqlInjectionProtection = (req, res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body);
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params);
  }
  if (req.query) {
    try {
      mongoSanitize.sanitize(req.query);
    } catch {
      // In Express 5 req.query may be an immutable getter in some contexts
    }
  }
  next();
};

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  apiLimiter,
  noSqlInjectionProtection,
};
