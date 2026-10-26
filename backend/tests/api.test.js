const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");
const { checkDatabaseConnection } = require("../src/config/db");

let authToken = "";
let createdExpenseId = "";
let createdGroupId = "";
let secondaryUserToken = "";

describe("ENTP Backend API Test Suite", () => {
  before(async () => {
    process.env.NODE_ENV = "test";
    await checkDatabaseConnection();
  });

  // 1. Health check
  test("GET /api/health returns healthy status", async () => {
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "healthy");
    assert.ok(res.body.databaseEngine);
  });

  // 2. Auth tests
  test("POST /api/auth/signup registers a new user", async () => {
    const uniqueEmail = `test_${Date.now()}@entp.app`;
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Test Runner",
        email: uniqueEmail,
        password: "Password@123",
        passwordConfirmation: "Password@123",
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.user.id);
    assert.ok(res.body.token);
    authToken = res.body.token;
  });

  test("POST /api/auth/signup rejects invalid input", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "A",
        email: "not-an-email",
        password: "123",
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test("GET /api/auth/me returns authenticated user details", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.name, "Test Runner");
  });

  test("GET /api/auth/me rejects unauthorized request", async () => {
    const res = await request(app).get("/api/auth/me");
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 3. Categories & Expense Management
  test("GET /api/expenses/categories lists available categories", async () => {
    const res = await request(app)
      .get("/api/expenses/categories")
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.categories));
    assert.ok(res.body.categories.length >= 8);
  });

  test("POST /api/expenses creates a new personal expense", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 450,
        description: "Dinner at Subway",
        categoryId: "cat-food",
        paymentMethod: "UPI",
        notes: "Healthy wrap meal",
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.expense.amount, 450);
    assert.equal(res.body.expense.description, "Dinner at Subway");
    createdExpenseId = res.body.expense.id;
  });

  test("GET /api/expenses retrieves user's expenses with pagination", async () => {
    const res = await request(app)
      .get("/api/expenses?page=1&limit=10")
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.expenses));
    assert.ok(res.body.pagination.total >= 1);
  });

  test("PUT /api/expenses/:id updates an existing expense", async () => {
    const res = await request(app)
      .put(`/api/expenses/${createdExpenseId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 520,
        description: "Dinner at Subway with Cookie",
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.expense.amount, 520);
    assert.equal(res.body.expense.description, "Dinner at Subway with Cookie");
  });

  // 4. Data Isolation Test
  test("Security: User cannot edit another user's private expense", async () => {
    // Create secondary user
    const secRes = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Secondary User",
        email: `secondary_${Date.now()}@entp.app`,
        password: "Password@123",
      });
    secondaryUserToken = secRes.body.token;

    // Attempt to edit primary user's expense
    const res = await request(app)
      .put(`/api/expenses/${createdExpenseId}`)
      .set("Authorization", `Bearer ${secondaryUserToken}`)
      .send({ amount: 9999 });

    assert.equal(res.status, 404);
  });

  // 5. Budgets
  test("POST /api/budgets sets a monthly budget and GET returns calculation", async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const postRes = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 15000,
        month,
        year,
      });

    assert.equal(postRes.status, 200);

    const getRes = await request(app)
      .get(`/api/budgets?month=${month}&year=${year}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(getRes.status, 200);
    const overall = getRes.body.budgets.find((b) => b.categoryId === null);
    assert.ok(overall);
    assert.equal(overall.amount, 15000);
    assert.ok(overall.spent >= 520);
    assert.ok(overall.remaining <= 14480);
  });

  // 6. Groups & Bill Splitting
  test("POST /api/groups creates a group and adds creator as admin", async () => {
    const res = await request(app)
      .post("/api/groups")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Flatmates",
        description: "Apartment sharing test",
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.group.name, "Test Flatmates");
    createdGroupId = res.body.group.id;
  });

  test("POST /api/groups/:id/members adds secondary user", async () => {
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${secondaryUserToken}`);
    const secUserId = meRes.body.user.id;

    const res = await request(app)
      .post(`/api/groups/${createdGroupId}/members`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ emailOrId: secUserId });

    assert.equal(res.status, 200);
  });

  test("POST /api/groups/:id/expenses records split expense and calculates debt", async () => {
    const primaryMe = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);
    const secMe = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${secondaryUserToken}`);

    const res = await request(app)
      .post(`/api/groups/${createdGroupId}/expenses`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 1000,
        description: "Grocery Bill",
        categoryId: "cat-food",
        paidById: primaryMe.body.user.id,
        splits: [
          { userId: primaryMe.body.user.id, amount: 500, percentage: 50 },
          { userId: secMe.body.user.id, amount: 500, percentage: 50 },
        ],
      });

    assert.equal(res.status, 201);

    // Verify group balance details
    const groupRes = await request(app)
      .get(`/api/groups/${createdGroupId}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(groupRes.status, 200);
    assert.ok(groupRes.body.group.simplifiedDebts.length > 0);
    assert.equal(groupRes.body.group.simplifiedDebts[0].amount, 500);
  });

  // 7. Dashboard and Analytics
  test("GET /api/analytics/dashboard returns calculated metrics including daily allowance", async () => {
    const res = await request(app)
      .get("/api/analytics/dashboard")
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.summary.monthlyBudget > 0);
    assert.ok(typeof res.body.summary.dailyAllowance === "number");
    assert.ok(res.body.summary.dailyAllowanceExplanation);
    assert.ok(Array.isArray(res.body.summary.last7Days));
  });

  // 8. Delete Expense
  test("DELETE /api/expenses/:id deletes expense successfully", async () => {
    const res = await request(app)
      .delete(`/api/expenses/${createdExpenseId}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
