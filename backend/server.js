
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const { connectDB, getDbInfo } = require("./config/db");
const {
  helmetMiddleware,
  corsMiddleware,
  apiLimiter,
  noSqlInjectionProtection,
} = require("./middleware/security");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

// Import Route Handlers
const expenseRoutes = require("./routes/expenseRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS for real-time WebSocket communication
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Real-Time Chat WebSocket Handlers (Experiment 8)
io.on("connection", (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // Confirm connection to client
  socket.emit("connected", {
    status: "connected",
    socketId: socket.id,
    timestamp: new Date().toISOString(),
  });

  // Listen for incoming chat messages and broadcast to all connected clients
  socket.on("chatMessage", (data) => {
    if (!data || typeof data !== "object") return;

    const username =
      typeof data.username === "string" && data.username.trim()
        ? data.username.trim().slice(0, 50)
        : "Anonymous";
    const message =
      typeof data.message === "string" && data.message.trim()
        ? data.message.trim().slice(0, 1000)
        : "";

    if (!message) return;

    const chatPayload = {
      id: `${socket.id}-${Date.now()}`,
      username,
      message,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    console.log(`[WebSocket] Message from ${username}: "${message}"`);
    io.emit("chatMessage", chatPayload);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[WebSocket] Client disconnected: ${socket.id} (${reason})`);
  });
});

// Security and Body Parsing Middleware (Preserved from Experiment 5)
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(noSqlInjectionProtection);

// Root Health & Metadata Endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    project: "Expense Tracker",
    status: "Online",
    experiment: "Experiment 10 - CI/CD Deployment with GitHub Actions + Render/Vercel",
    securityFeatures: {
      helmet: "Enabled (Secure HTTP Headers, CSP, Frameguard)",
      cors: "Enabled (Whitelisted Origins & Socket.IO)",
      rateLimit: "Enabled (100 req/15min Window)",
      mongoSanitize: "Enabled (NoSQL Injection Protection)",
      jwtAuth: "Enabled (Stateless Bearer Verification & RBAC)",
      webSockets: "Enabled (Socket.IO Real-Time Chat)",
    },
    database: getDbInfo(),
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
      },
      protected: {
        user: "GET /api/protected/user",
        admin: "GET /api/protected/admin",
      },
      expenses: {
        list: "GET /api/expenses",
        create: "POST /api/expenses",
      },
      realtime: {
        websocket: "ws://localhost:5001/socket.io/",
        event: "chatMessage",
      },
    },
  });
});

// Experiment 7: Docker Backend Health & Connectivity Route
app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Backend is running inside Docker!",
    project: "Expense Tracker",
    status: "Online",
    environment: process.env.NODE_ENV || "development",
    database: getDbInfo(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes (Experiments 1-6)
app.use("/api/expenses", apiLimiter, expenseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Database Connection (Atlas with automatic local fallback)
connectDB();

// Start HTTP & WebSocket Server if invoked directly
const PORT = process.env.PORT || 5001;
if (require.main === module) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Expense Tracker backend listening on port ${PORT} (0.0.0.0)`);
    console.log(`[Server] Active experiment: Experiment 10 (CI/CD Deployment with GitHub Actions + Render/Vercel)`);
    console.log(`[Server] Socket.IO real-time engine ready on port ${PORT}`);
  });
}

app.server = server;
app.io = io;
module.exports = app;



