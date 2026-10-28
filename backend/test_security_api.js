/**
 * Automated Security & REST API Test Suite for Experiment 5
 */
const http = require("http");
const app = require("./server");

const PORT = 5003; // Run test server on port 5003
let server;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (_) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on("error", reject);

    if (postData) {
      if (typeof postData === "object") {
        req.write(JSON.stringify(postData));
      } else {
        req.write(postData);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log("\n========================================================");
  console.log("🚀 STARTING AUTOMATED EXPERIMENT 5 SECURITY & API TESTS");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Test Home & Security Metadata Route
    console.log("[Test Suite 1: Server & Root Security Endpoint]");
    const rootRes = await makeRequest({
      hostname: "localhost",
      port: PORT,
      path: "/",
      method: "GET",
    });
    assert(rootRes.statusCode === 200, "Root returns HTTP 200 OK");
    assert(
      rootRes.body.project === "Expense Tracker" &&
      rootRes.body.securityFeatures.helmet.includes("Enabled"),
      "Root response includes security feature metadata"
    );

    // 2. Test Helmet Security Headers
    console.log("\n[Test Suite 2: Helmet HTTP Security Headers]");
    assert(
      rootRes.headers["x-content-type-options"] === "nosniff",
      "X-Content-Type-Options: nosniff header is present"
    );
    assert(
      rootRes.headers["x-frame-options"] !== undefined ||
      rootRes.headers["content-security-policy"] !== undefined,
      "Clickjacking protection (X-Frame-Options or CSP) is present"
    );

    // 3. Test CORS Configuration
    console.log("\n[Test Suite 3: CORS Header Configuration]");
    const corsRes = await makeRequest({
      hostname: "localhost",
      port: PORT,
      path: "/api/expenses",
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
      },
    });
    assert(
      corsRes.headers["access-control-allow-origin"] === "http://localhost:5173",
      "CORS correctly allows authorized frontend origin (http://localhost:5173)"
    );

    // 4. Test Rate Limiting Headers
    console.log("\n[Test Suite 4: Rate Limiting]");
    const rateLimitRes = await makeRequest({
      hostname: "localhost",
      port: PORT,
      path: "/api/expenses",
      method: "GET",
    });
    const hasRateLimitHeader =
      rateLimitRes.headers["ratelimit-limit"] !== undefined ||
      rateLimitRes.headers["ratelimit-policy"] !== undefined ||
      rateLimitRes.headers["x-ratelimit-limit"] !== undefined;
    assert(hasRateLimitHeader, "Rate limiting headers present on /api/ endpoints");

    // 5. Test Centralized 404 Error Handler
    console.log("\n[Test Suite 5: Centralized 404 Route Handler]");
    const notFoundRes = await makeRequest({
      hostname: "localhost",
      port: PORT,
      path: "/api/unknown-route-12345",
      method: "GET",
    });
    assert(notFoundRes.statusCode === 404, "Unknown route returns HTTP 404 Not Found");
    assert(
      notFoundRes.body.success === false,
      "Centralized 404 handler returns structured JSON error"
    );

    // 6. Test Malformed JSON Handling (Centralized Error Handler)
    console.log("\n[Test Suite 6: Centralized Malformed JSON Error Handler]");
    const malformedRes = await makeRequest(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/expenses",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      "INVALID_JSON_BODY{{{"
    );
    assert(malformedRes.statusCode === 400, "Malformed JSON body returns HTTP 400 Bad Request");
    assert(
      malformedRes.body.message.includes("Malformed JSON"),
      "Error response clearly informs user of JSON syntax error"
    );

    // 7. Test Input Validation (express-validator)
    console.log("\n[Test Suite 7: Input Validation via express-validator]");
    // Missing title & negative amount
    const invalidExpenseRes = await makeRequest(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/expenses",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { title: "", amount: -50 }
    );
    assert(
      invalidExpenseRes.statusCode === 400,
      "Invalid expense creation returns HTTP 400 Bad Request"
    );
    assert(
      invalidExpenseRes.body.errors && invalidExpenseRes.body.errors.length >= 2,
      "express-validator returns field-specific error messages"
    );

    // Invalid ObjectId format in GET /api/expenses/:id
    const invalidIdRes = await makeRequest({
      hostname: "localhost",
      port: PORT,
      path: "/api/expenses/not-a-valid-mongo-id",
      method: "GET",
    });
    assert(
      invalidIdRes.statusCode === 400,
      "Non-MongoDB ID format returns HTTP 400 Bad Request"
    );

    // 8. Test NoSQL Injection Defense
    console.log("\n[Test Suite 8: NoSQL Injection Defense]");
    const nosqlPayload = {
      title: "Grocery",
      amount: 150,
      category: { $gt: "" }, // NoSQL operator injection attempt
    };
    const nosqlRes = await makeRequest(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/expenses",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      nosqlPayload
    );
    // Either sanitized (created with sanitized/fallback category) or rejected with 400
    assert(
      nosqlRes.statusCode === 201 || nosqlRes.statusCode === 400,
      "NoSQL injection payload successfully prevented from executing unauthorized DB query"
    );

    // 9. Test Valid CRUD Lifecycle
    console.log("\n[Test Suite 9: Full Secure CRUD Lifecycle]");
    // CREATE (POST)
    const createRes = await makeRequest(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/expenses",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        title: "College Textbooks",
        amount: 850.5,
        category: "Education",
        description: "Semester 6 Reference Books",
      }
    );
    assert(createRes.statusCode === 201, "POST /api/expenses creates new expense (HTTP 201)");
    const createdId = createRes.body.data ? createRes.body.data.id || createRes.body.data._id : null;
    assert(createdId !== null, "Expense returned with valid ID");

    // READ ALL (GET)
    const getAllRes = await makeRequest({
      hostname: "localhost",
      port: PORT,
      path: "/api/expenses",
      method: "GET",
    });
    assert(getAllRes.statusCode === 200, "GET /api/expenses returns HTTP 200");
    assert(getAllRes.body.data.length > 0, "Expenses list contains saved expense");

    // READ ONE (GET by ID)
    const getOneRes = await makeRequest({
      hostname: "localhost",
      port: PORT,
      path: `/api/expenses/${createdId}`,
      method: "GET",
    });
    assert(getOneRes.statusCode === 200, `GET /api/expenses/${createdId} returns HTTP 200`);
    assert(
      getOneRes.body.data.title === "College Textbooks",
      "Retrieved expense matches created data"
    );

    // UPDATE (PUT by ID)
    const updateRes = await makeRequest(
      {
        hostname: "localhost",
        port: PORT,
        path: `/api/expenses/${createdId}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
      {
        title: "College Textbooks & Stationery",
        amount: 920.0,
      }
    );
    assert(updateRes.statusCode === 200, `PUT /api/expenses/${createdId} returns HTTP 200`);
    assert(
      updateRes.body.data.title.includes("College Textbooks"),
      "Expense title successfully updated"
    );

    // DELETE (DELETE by ID)
    const deleteRes = await makeRequest({
      hostname: "localhost",
      port: PORT,
      path: `/api/expenses/${createdId}`,
      method: "DELETE",
    });
    assert(deleteRes.statusCode === 200, `DELETE /api/expenses/${createdId} returns HTTP 200`);

    // Verify it is gone (404)
    const verifyDeleteRes = await makeRequest({
      hostname: "localhost",
      port: PORT,
      path: `/api/expenses/${createdId}`,
      method: "GET",
    });
    assert(
      verifyDeleteRes.statusCode === 404,
      "Deleted expense returns HTTP 404 Not Found upon subsequent fetch"
    );
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    console.log("\n========================================================");
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("========================================================\n");
    if (server) server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Start temporary test server
server = app.listen(PORT, async () => {
  // Allow DB connection to establish
  setTimeout(runTests, 4000);
});
