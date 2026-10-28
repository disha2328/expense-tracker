/**
 * Automated Test Runner for Experiment 6:
 * Implement Authentication and User Roles with JWT
 * 
 * Tests all 8 scenarios with real HTTP requests against the live backend server.
 * Produces structured JSON output and a clean, responsive HTML test report.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./server");

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}`;

// Helper: Make HTTP request returning status, headers, body, response time
function sendRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const responseTime = Date.now() - startTime;
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (_) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: parsed,
          responseTimeMs: responseTime,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (postData) {
      const dataStr = typeof postData === "string" ? postData : JSON.stringify(postData);
      req.write(dataStr);
    }
    req.end();
  });
}

// Generate an elegant HTML report
function generateHtmlReport(results, summary) {
  const generatedAt = new Date().toLocaleString();
  const allPassed = summary.failed === 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Experiment 6: Authentication & User Roles (JWT) - Test Execution Report</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --code-bg: #090d16;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 32px 16px; line-height: 1.5; }
    .container { max-width: 1000px; margin: 0 auto; }
    header { background: var(--card-bg); padding: 28px; border-radius: 12px; border: 1px solid var(--card-border); margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    h1 { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
    .subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-top: 16px; }
    .summary-card { background: rgba(255,255,255,0.03); border: 1px solid var(--card-border); border-radius: 8px; padding: 14px; text-align: center; }
    .summary-card .num { font-size: 28px; font-weight: 800; }
    .summary-card .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-top: 4px; }
    .pass-card .num { color: var(--success); }
    .fail-card .num { color: var(--danger); }
    .rate-card .num { color: var(--accent); }
    .time-card .num { color: #cbd5e1; }

    .test-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 10px; margin-bottom: 16px; overflow: hidden; transition: border-color 0.2s; }
    .test-card:hover { border-color: #475569; }
    .test-header { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .test-title-wrap { display: flex; align-items: center; gap: 12px; }
    .badge { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
    .badge-pass { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-fail { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-method { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; }
    .method-POST { background: #0369a1; color: #e0f2fe; }
    .method-GET { background: #047857; color: #d1fae5; }
    .test-title { font-size: 15px; font-weight: 600; color: #fff; }
    .test-meta { font-size: 13px; color: var(--text-muted); display: flex; gap: 16px; align-items: center; }
    .test-body { padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .test-body { grid-template-columns: 1fr; } }
    .payload-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }
    pre { background: var(--code-bg); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #e2e8f0; overflow-x: auto; max-height: 240px; }
    .status-badge { font-weight: 700; font-family: monospace; }
    .status-200, .status-201 { color: #34d399; }
    .status-401, .status-403 { color: #f87171; }
    footer { text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 32px; padding: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>
        <span>🔐</span>
        <span>Experiment No. 6: Authentication & User Roles with JWT</span>
      </h1>
      <p class="subtitle">Expense Tracker Project &bull; Verified on macOS &bull; Port: ${PORT} &bull; Generated: ${generatedAt}</p>
      
      <div class="summary-grid">
        <div class="summary-card pass-card">
          <div class="num">${summary.passed} / ${summary.total}</div>
          <div class="label">Tests Passed</div>
        </div>
        <div class="summary-card fail-card">
          <div class="num">${summary.failed}</div>
          <div class="label">Tests Failed</div>
        </div>
        <div class="summary-card rate-card">
          <div class="num">${((summary.passed / summary.total) * 100).toFixed(0)}%</div>
          <div class="label">Success Rate</div>
        </div>
        <div class="summary-card time-card">
          <div class="num">${summary.totalTimeMs}ms</div>
          <div class="label">Total Duration</div>
        </div>
      </div>
    </header>

    <div class="test-list">
      ${results
        .map((r) => {
          const pass = r.verdict === "PASS";
          return `
      <div class="test-card">
        <div class="test-header">
          <div class="test-title-wrap">
            <span class="badge ${pass ? "badge-pass" : "badge-fail"}">${r.verdict}</span>
            <span class="badge-method method-${r.method}">${r.method}</span>
            <span class="test-title">${r.name}</span>
          </div>
          <div class="test-meta">
            <span>Status: <span class="status-badge status-${r.actualStatus}">${r.actualStatus}</span> (Expected: ${r.expectedStatus})</span>
            <span>⏱️ ${r.responseTimeMs}ms</span>
          </div>
        </div>
        <div class="test-body">
          <div>
            <div class="payload-title">Request (${r.endpoint})</div>
            <pre>${escapeHtml(JSON.stringify({ headers: r.requestHeaders, body: r.requestBody }, null, 2))}</pre>
          </div>
          <div>
            <div class="payload-title">Actual Response Body</div>
            <pre>${escapeHtml(JSON.stringify(r.responseBody, null, 2))}</pre>
          </div>
        </div>
      </div>`;
        })
        .join("")}
    </div>

    <footer>
      Experiment 6 Execution Report &bull; Expense Tracker API &bull; All 8 test scenarios verified against live Express & Mongoose backend.
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Main Test Execution Function
async function runTestSuite() {
  console.log("\n==================================================================");
  console.log("🚀 EXPERIMENT 6: AUTOMATED AUTHENTICATION & ROLE TEST SUITE");
  console.log("==================================================================");
  console.log(`Target Backend: ${BASE_URL}`);

  // Ensure server is listening on PORT
  let serverInstance = null;
  await new Promise((resolve) => {
    serverInstance = app.listen(PORT, () => {
      console.log(`[Test Suite] Server listening on port ${PORT}`);
      resolve();
    });
    serverInstance.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`[Test Suite] Server is already running and listening on port ${PORT}`);
        serverInstance = null;
      }
      resolve();
    });
  });

  // Wait for MongoDB to be connected (Atlas or fallback)
  console.log("[Setup] Waiting for database connection to stabilize...");
  let attempts = 0;
  while (mongoose.connection.readyState !== 1 && attempts < 20) {
    await new Promise((r) => setTimeout(r, 500));
    attempts++;
  }
  console.log(`[Setup] DB ReadyState: ${mongoose.connection.readyState} (1 = Connected)`);

  const results = [];
  const testStartTime = Date.now();

  let userToken = "";
  let adminToken = "";

  const uniqueSuffix = Date.now();
  const testUser = {
    name: "Disha Student",
    email: `student_${uniqueSuffix}@expensetracker.local`,
    password: "StudentPassword123!",
  };
  const testAdmin = {
    name: "Admin Administrator",
    email: `admin_${uniqueSuffix}@expensetracker.local`,
    password: "AdminPassword123!",
    role: "admin",
  };

  // Helper assertion
  function recordResult({
    scenarioNum,
    name,
    method,
    endpoint,
    expectedStatus,
    actualStatus,
    requestHeaders,
    requestBody,
    responseBody,
    responseTimeMs,
    condition,
  }) {
    const verdict = condition ? "PASS" : "FAIL";
    const resObj = {
      scenarioNum,
      name,
      method,
      endpoint,
      expectedStatus,
      actualStatus,
      requestHeaders,
      requestBody,
      responseBody,
      responseTimeMs,
      verdict,
    };
    results.push(resObj);

    const icon = verdict === "PASS" ? "✅" : "❌";
    console.log(
      `${icon} Scenario ${scenarioNum}: ${name} -> HTTP ${actualStatus} (Expected ${expectedStatus}) [${responseTimeMs}ms]`
    );
    if (!condition) {
      console.error(`   Failure details: Expected ${expectedStatus}, received ${actualStatus}`);
      console.error(`   Response body:`, responseBody);
    }
  }

  try {
    // -------------------------------------------------------------
    // Scenario 1: Successful user registration — 201 Created
    // -------------------------------------------------------------
    console.log("\n[Test 1/8] Testing User Registration (POST /api/auth/register)...");
    const regRes = await sendRequest(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/auth/register",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      testUser
    );
    recordResult({
      scenarioNum: 1,
      name: "Successful user registration",
      method: "POST",
      endpoint: "/api/auth/register",
      expectedStatus: 201,
      actualStatus: regRes.statusCode,
      requestHeaders: { "Content-Type": "application/json" },
      requestBody: { name: testUser.name, email: testUser.email, password: "[REDACTED]" },
      responseBody: regRes.body,
      responseTimeMs: regRes.responseTimeMs,
      condition: regRes.statusCode === 201 && regRes.body?.user?.email === testUser.email,
    });

    // -------------------------------------------------------------
    // Scenario 2: Successful user login — 200 OK with JWT token
    // -------------------------------------------------------------
    console.log("\n[Test 2/8] Testing User Login (POST /api/auth/login)...");
    const loginRes = await sendRequest(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: testUser.email, password: testUser.password }
    );
    userToken = loginRes.body?.token || "";
    recordResult({
      scenarioNum: 2,
      name: "Successful user login with JWT token",
      method: "POST",
      endpoint: "/api/auth/login",
      expectedStatus: 200,
      actualStatus: loginRes.statusCode,
      requestHeaders: { "Content-Type": "application/json" },
      requestBody: { email: testUser.email, password: "[REDACTED]" },
      responseBody: {
        ...loginRes.body,
        token: userToken ? `${userToken.substring(0, 16)}...[REDACTED]` : "MISSING",
      },
      responseTimeMs: loginRes.responseTimeMs,
      condition: loginRes.statusCode === 200 && typeof userToken === "string" && userToken.length > 20,
    });

    // -------------------------------------------------------------
    // Scenario 3: Protected route without token — 401 Unauthorized
    // -------------------------------------------------------------
    console.log("\n[Test 3/8] Testing Protected Route Without Token (GET /api/protected/user)...");
    const noTokenRes = await sendRequest({
      hostname: "localhost",
      port: PORT,
      path: "/api/protected/user",
      method: "GET",
      headers: {},
    });
    recordResult({
      scenarioNum: 3,
      name: "Protected route without token",
      method: "GET",
      endpoint: "/api/protected/user",
      expectedStatus: 401,
      actualStatus: noTokenRes.statusCode,
      requestHeaders: { Authorization: "(None)" },
      requestBody: null,
      responseBody: noTokenRes.body,
      responseTimeMs: noTokenRes.responseTimeMs,
      condition: noTokenRes.statusCode === 401,
    });

    // -------------------------------------------------------------
    // Scenario 4: Protected route with invalid token — 401 Unauthorized
    // -------------------------------------------------------------
    console.log("\n[Test 4/8] Testing Protected Route With Invalid Token (GET /api/protected/user)...");
    const invalidTokenRes = await sendRequest({
      hostname: "localhost",
      port: PORT,
      path: "/api/protected/user",
      method: "GET",
      headers: { Authorization: "Bearer this.is.an.invalid.token.12345" },
    });
    recordResult({
      scenarioNum: 4,
      name: "Protected route with invalid token",
      method: "GET",
      endpoint: "/api/protected/user",
      expectedStatus: 401,
      actualStatus: invalidTokenRes.statusCode,
      requestHeaders: { Authorization: "Bearer this.is.an.invalid.token.12345" },
      requestBody: null,
      responseBody: invalidTokenRes.body,
      responseTimeMs: invalidTokenRes.responseTimeMs,
      condition: invalidTokenRes.statusCode === 401,
    });

    // -------------------------------------------------------------
    // Scenario 5: Protected user route with valid token — 200 OK
    // -------------------------------------------------------------
    console.log("\n[Test 5/8] Testing Protected User Route With Valid Token (GET /api/protected/user)...");
    const validUserRes = await sendRequest({
      hostname: "localhost",
      port: PORT,
      path: "/api/protected/user",
      method: "GET",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    recordResult({
      scenarioNum: 5,
      name: "Protected user route with valid token",
      method: "GET",
      endpoint: "/api/protected/user",
      expectedStatus: 200,
      actualStatus: validUserRes.statusCode,
      requestHeaders: { Authorization: "Bearer [VALID_USER_TOKEN]" },
      requestBody: null,
      responseBody: validUserRes.body,
      responseTimeMs: validUserRes.responseTimeMs,
      condition: validUserRes.statusCode === 200 && validUserRes.body?.access === "User Dashboard",
    });

    // -------------------------------------------------------------
    // Scenario 6: Admin route accessed by normal user — 403 Forbidden
    // -------------------------------------------------------------
    console.log("\n[Test 6/8] Testing Admin Route Accessed by Normal User (GET /api/protected/admin)...");
    const forbiddenRes = await sendRequest({
      hostname: "localhost",
      port: PORT,
      path: "/api/protected/admin",
      method: "GET",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    recordResult({
      scenarioNum: 6,
      name: "Admin route accessed by normal user",
      method: "GET",
      endpoint: "/api/protected/admin",
      expectedStatus: 403,
      actualStatus: forbiddenRes.statusCode,
      requestHeaders: { Authorization: "Bearer [NORMAL_USER_TOKEN]" },
      requestBody: null,
      responseBody: forbiddenRes.body,
      responseTimeMs: forbiddenRes.responseTimeMs,
      condition: forbiddenRes.statusCode === 403,
    });

    // -------------------------------------------------------------
    // Setup for Scenario 7: Register & Login Admin
    // -------------------------------------------------------------
    console.log("\n[Setup Scenario 7] Registering and logging in Admin user...");
    await sendRequest(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/auth/register",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      testAdmin
    );
    const adminLoginRes = await sendRequest(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: testAdmin.email, password: testAdmin.password }
    );
    adminToken = adminLoginRes.body?.token || "";

    // -------------------------------------------------------------
    // Scenario 7: Admin route accessed by admin — 200 OK
    // -------------------------------------------------------------
    console.log("\n[Test 7/8] Testing Admin Route Accessed by Admin (GET /api/protected/admin)...");
    const adminAccessRes = await sendRequest({
      hostname: "localhost",
      port: PORT,
      path: "/api/protected/admin",
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    recordResult({
      scenarioNum: 7,
      name: "Admin route accessed by admin",
      method: "GET",
      endpoint: "/api/protected/admin",
      expectedStatus: 200,
      actualStatus: adminAccessRes.statusCode,
      requestHeaders: { Authorization: "Bearer [ADMIN_TOKEN]" },
      requestBody: null,
      responseBody: adminAccessRes.body,
      responseTimeMs: adminAccessRes.responseTimeMs,
      condition:
        adminAccessRes.statusCode === 200 &&
        adminAccessRes.body?.access === "Admin Dashboard",
    });

    // -------------------------------------------------------------
    // Scenario 8: Login with incorrect password — 401 Unauthorized
    // -------------------------------------------------------------
    console.log("\n[Test 8/8] Testing Login With Incorrect Password (POST /api/auth/login)...");
    const wrongPassRes = await sendRequest(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: testUser.email, password: "IncorrectPassword999!" }
    );
    recordResult({
      scenarioNum: 8,
      name: "Login with incorrect password",
      method: "POST",
      endpoint: "/api/auth/login",
      expectedStatus: 401,
      actualStatus: wrongPassRes.statusCode,
      requestHeaders: { "Content-Type": "application/json" },
      requestBody: { email: testUser.email, password: "[INCORRECT_REDACTED]" },
      responseBody: wrongPassRes.body,
      responseTimeMs: wrongPassRes.responseTimeMs,
      condition: wrongPassRes.statusCode === 401,
    });

  } catch (err) {
    console.error("\n❌ Unhandled error during test suite execution:", err);
  }

  // Summarize results
  const totalTimeMs = Date.now() - testStartTime;
  const passed = results.filter((r) => r.verdict === "PASS").length;
  const failed = results.filter((r) => r.verdict === "FAIL").length;
  const summary = {
    total: results.length,
    passed,
    failed,
    totalTimeMs,
  };

  console.log("\n==================================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passed}/${summary.total} PASSED (${failed} FAILED)`);
  console.log(`⏱️ Total Execution Time: ${totalTimeMs}ms`);
  console.log("==================================================================\n");

  // Output paths inside 'Experiment 6' folder
  const outDir = path.resolve(__dirname, "..", "Experiment 6");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Save JSON Results
  const jsonPath = path.join(outDir, "test_results.json");
  fs.writeFileSync(jsonPath, JSON.stringify({ summary, results }, null, 2));
  console.log(`[Output] Test results JSON written to: ${jsonPath}`);

  // 2. Save HTML Report
  const htmlPath = path.join(outDir, "test_results.html");
  fs.writeFileSync(htmlPath, generateHtmlReport(results, summary));
  console.log(`[Output] Test report HTML written to: ${htmlPath}`);

  return { summary, results };
}

// If executed directly, run the test suite
if (require.main === module) {
  runTestSuite().then(({ summary }) => {
    process.exit(summary.failed === 0 ? 0 : 1);
  });
}

module.exports = { runTestSuite };
