const bcrypt = require("bcryptjs");
const { getDatabase } = require("../src/config/db");

async function seed() {
  console.log("🌱 Starting ENTP seed script...");
  const db = getDatabase();

  const passwordHash = await bcrypt.hash("Password@123", 10);

  if (db.engine === "sqlite") {
    const s = db.sqlite;

    // Check if demo user already exists
    const existing = s.prepare("SELECT id FROM users WHERE email = ?").get("demo@entp.app");
    if (existing) {
      console.log("Demo user already exists. Skipping duplicate seeding.");
      return;
    }

    const insertUser = s.prepare(`
      INSERT INTO users (id, name, email, password, avatar, currency, dateFormat)
      VALUES (?, ?, ?, ?, ?, 'INR', 'DD/MM/YYYY')
    `);

    const pranjalId = "user-demo-pranjal";
    const rahulId = "user-demo-rahul";
    const ananyaId = "user-demo-ananya";

    insertUser.run(pranjalId, "Pranjal Manjare", "demo@entp.app", passwordHash, "P");
    insertUser.run(rahulId, "Rahul Sharma", "rahul@entp.app", passwordHash, "R");
    insertUser.run(ananyaId, "Ananya Iyer", "ananya@entp.app", passwordHash, "A");

    // Budgets for Pranjal
    const insertBudget = s.prepare(`
      INSERT INTO budgets (id, userId, categoryId, month, year, amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    insertBudget.run("budget-overall", pranjalId, null, currentMonth, currentYear, 20000);
    insertBudget.run("budget-food", pranjalId, "cat-food", currentMonth, currentYear, 6000);
    insertBudget.run("budget-transport", pranjalId, "cat-transport", currentMonth, currentYear, 2500);
    insertBudget.run("budget-shopping", pranjalId, "cat-shopping", currentMonth, currentYear, 4000);

    // Personal expenses for Pranjal
    const insertExpense = s.prepare(`
      INSERT INTO expenses (id, userId, categoryId, groupId, paidById, amount, description, date, paymentMethod, notes, isGroupExpense)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();
    const fiveDaysAgo = new Date(Date.now() - 86400000 * 5).toISOString();

    insertExpense.run("exp-1", pranjalId, "cat-food", null, pranjalId, 340, "Lunch at Café Coffee Day", today, "UPI", "Had sandwich & cappuccino", 0);
    insertExpense.run("exp-2", pranjalId, "cat-transport", null, pranjalId, 120, "Metro Card Recharge", yesterday, "UPI", "Office commute", 0);
    insertExpense.run("exp-3", pranjalId, "cat-shopping", null, pranjalId, 1299, "Zara Linen Shirt", twoDaysAgo, "Card", "Weekend discount sale", 0);
    insertExpense.run("exp-4", pranjalId, "cat-food", null, pranjalId, 550, "Dinner with friends at Social", fiveDaysAgo, "UPI", "Dinner split", 0);
    insertExpense.run("exp-5", pranjalId, "cat-entertainment", null, pranjalId, 450, "Movie ticket - IMAX", fiveDaysAgo, "UPI", "Watched sci-fi flick", 0);

    // Group: Apartment 402
    const groupId = "group-apt-402";
    s.prepare("INSERT INTO groups (id, name, description, createdById) VALUES (?, ?, ?, ?)").run(
      groupId,
      "Apartment 402 Flatmates",
      "Shared flat rent, groceries and utilities",
      pranjalId
    );

    const insertMember = s.prepare("INSERT INTO group_memberships (id, groupId, userId, role) VALUES (?, ?, ?, ?)");
    insertMember.run("mem-1", groupId, pranjalId, "ADMIN");
    insertMember.run("mem-2", groupId, rahulId, "MEMBER");
    insertMember.run("mem-3", groupId, ananyaId, "MEMBER");

    // Group expense: Groceries ₹3,600 paid by Pranjal, split equally (₹1,200 each)
    const grpExp1 = "exp-grp-1";
    insertExpense.run(grpExp1, pranjalId, "cat-food", groupId, pranjalId, 3600, "DMart Monthly Groceries", yesterday, "UPI", "Rice, oil, spices, veggies", 1);

    const insertSplit = s.prepare("INSERT INTO expense_splits (id, expenseId, userId, amount, percentage) VALUES (?, ?, ?, ?, ?)");
    insertSplit.run("split-1", grpExp1, pranjalId, 1200, 33.33);
    insertSplit.run("split-2", grpExp1, rahulId, 1200, 33.33);
    insertSplit.run("split-3", grpExp1, ananyaId, 1200, 33.33);

    // Group expense: WiFi Bill ₹1,500 paid by Rahul, split equally (₹500 each)
    const grpExp2 = "exp-grp-2";
    insertExpense.run(grpExp2, rahulId, "cat-bills", groupId, rahulId, 1500, "Airtel Xstream Fiber Bill", twoDaysAgo, "UPI", "300 Mbps plan", 1);
    insertSplit.run("split-4", grpExp2, pranjalId, 500, 33.33);
    insertSplit.run("split-5", grpExp2, rahulId, 500, 33.33);
    insertSplit.run("split-6", grpExp2, ananyaId, 500, 33.33);

    // Recurring expense
    s.prepare(`
      INSERT INTO recurring_expenses (id, userId, categoryId, amount, description, frequency, startDate, nextDueDate, paymentMethod)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "rec-1",
      pranjalId,
      "cat-entertainment",
      649,
      "Netflix 4K Premium Plan",
      "MONTHLY",
      today,
      new Date(Date.now() + 86400000 * 20).toISOString(),
      "UPI"
    );

    // Notifications
    const insertNotif = s.prepare("INSERT INTO notifications (id, userId, title, message, type) VALUES (?, ?, ?, ?, ?)");
    insertNotif.run("notif-1", pranjalId, "Welcome to ENTP!", "Start tracking personal and shared expenses effortlessly.", "SYSTEM");
    insertNotif.run("notif-2", pranjalId, "Group Expense Added", "Rahul added Airtel Fiber Bill (₹1,500) to Apartment 402.", "GROUP_EXPENSE");
    insertNotif.run("notif-3", pranjalId, "Budget Update", "You have utilized 32% of your monthly budget. Spending is healthy.", "BUDGET_ALERT");

    console.log("✅ Fictional demo dataset seeded successfully into local database!");
    console.log("Demo credentials: demo@entp.app / Password@123");
  }
}

seed().catch(console.error);
