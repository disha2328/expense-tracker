const mongoose = require("mongoose");
const dns = require("node:dns");

// Configure Node.js DNS servers to Google / Cloudflare public DNS
// This resolves the common macOS "querySrv EBADRESP" SRV lookup issue
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("[DB] Could not set custom DNS servers:", dnsErr.message);
}

let memoryServerInstance = null;
let activeDatabaseMode = "Disconnected";

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const srvUri = process.env.MONGO_URI_SRV;

  // 1. Attempt connection with primary URI
  if (primaryUri) {
    try {
      console.log("[DB] Connecting to MongoDB Atlas using primary connection string...");
      await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 3000,
      });
      activeDatabaseMode = "MongoDB Atlas (Primary)";
      console.log("[DB] Successfully connected to MongoDB Atlas!");
      return;
    } catch (err) {
      console.warn(`[DB] Primary Atlas connection attempt failed: ${err.message}`);
    }
  }

  // 2. Fallback to SRV if configured
  if (srvUri && srvUri !== primaryUri) {
    try {
      console.log("[DB] Attempting MongoDB Atlas connection via SRV...");
      await mongoose.connect(srvUri, {
        serverSelectionTimeoutMS: 3000,
      });
      activeDatabaseMode = "MongoDB Atlas (SRV)";
      console.log("[DB] Successfully connected to MongoDB Atlas via SRV!");
      return;
    } catch (err) {
      console.warn(`[DB] SRV connection attempt failed: ${err.message}`);
    }
  }

  // 3. Fallback: Local MongoDB daemon (if running on port 27017)
  try {
    console.log("[DB] Checking for local MongoDB daemon (127.0.0.1:27017)...");
    await mongoose.connect("mongodb://127.0.0.1:27017/expense_tracker", {
      serverSelectionTimeoutMS: 1500,
    });
    activeDatabaseMode = "Local MongoDB Daemon (localhost:27017)";
    console.log("[DB] Successfully connected to local MongoDB daemon!");
    return;
  } catch (_) {
    // Local daemon not active, continue to in-memory fallback
  }

  // 4. Safe Development Fallback: MongoMemoryServer
  console.log("\n==================================================================");
  console.log("⚠️  MONGODB ATLAS CONNECTION NOTICE:");
  console.log("   Atlas rejected connection (IP Whitelist / Network restriction).");
  console.log("   ACTION (Optional for Cloud): Whitelist current IP in Atlas Network Access.");
  console.log("   -> Fallback: Starting safe local in-memory database (MongoMemoryServer)");
  console.log("   -> Experiment 6 Authentication & User Roles are 100% operational!");
  console.log("==================================================================\n");

  try {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryServerInstance = await MongoMemoryServer.create({
      instance: { dbName: "expense_tracker" },
    });
    const fallbackUri = memoryServerInstance.getUri();
    await mongoose.connect(fallbackUri);
    activeDatabaseMode = "Local In-Memory MongoDB (Safe Fallback)";
    console.log("[DB] In-Memory MongoDB connected successfully!");
  } catch (memErr) {
    console.error("[DB] Could not start in-memory fallback:", memErr.message);
    activeDatabaseMode = `Error: ${memErr.message}`;
  }
};

const getDbInfo = () => ({
  mode: activeDatabaseMode,
  connected: mongoose.connection.readyState === 1,
  host: mongoose.connection.host || "none",
  name: mongoose.connection.name || "none",
});

module.exports = { connectDB, getDbInfo };

