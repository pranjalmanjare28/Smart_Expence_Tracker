const { getDatabase } = require("../backend/src/config/db");

const db = getDatabase();
const s = db.sqlite;

console.log("\n==================== 📊 SMART EXPENSES TRACKER DATABASE OVERVIEW ====================");
console.log(`Database File: backend/data/expenses.db\n`);

console.log("👤 USERS TABLE:");
console.table(s.prepare("SELECT id, name, email, currency, dateFormat FROM users").all());

console.log("\n💸 EXPENSES TABLE:");
console.table(
  s.prepare(`
    SELECT e.id, e.description, e.amount, e.paymentMethod, e.date, c.name as category
    FROM expenses e
    JOIN categories c ON e.categoryId = c.id
    ORDER BY e.date DESC
  `).all()
);

console.log("\n🎯 BUDGETS TABLE:");
console.table(s.prepare("SELECT id, month, year, amount, categoryId FROM budgets").all());

console.log("\n👥 GROUPS TABLE:");
console.table(s.prepare("SELECT id, name, description, createdById FROM groups").all());

console.log("\n📦 CATEGORIES TABLE:");
console.table(s.prepare("SELECT id, name, icon, color FROM categories").all());
console.log("===================================================================\n");
