#!/usr/bin/env node
/**
 * Smart Expenses Tracker MongoDB Atlas Sync & Seed Script
 * Allows viewing the entire Smart Expenses database in MongoDB Atlas & VS Code MongoDB Extension.
 */

const path = require("path");

// Resolve dependencies from backend/node_modules
const backendDir = path.join(__dirname, "../backend");
const backendNodeModules = path.join(backendDir, "node_modules");

try {
  require(path.join(backendNodeModules, "dotenv")).config({
    path: path.join(backendDir, ".env"),
  });
} catch (e) {
  // dotenv optional if args passed
}

const mongoose = require(path.join(backendNodeModules, "mongoose"));
const { getDatabase } = require(path.join(backendDir, "src/config/db"));
const {
  MongoUser,
  MongoCategory,
  MongoExpense,
  MongoBudget,
  MongoGroup,
  MongoRecurring,
  MongoNotification,
} = require(path.join(backendDir, "src/models/mongoModels"));

let rawUri = process.argv[2] || process.env.MONGODB_URI;

if (!rawUri) {
  console.error("❌ Error: Please provide a MongoDB Atlas connection string!");
  console.log("\nExample usage:");
  console.log('  node scripts/syncToMongo.js "mongodb+srv://user:pass@cluster.mongodb.net/smartexpenses?retryWrites=true&w=majority"');
  process.exit(1);
}

// Ensure database name 'smartexpenses' is included in URI if missing
let mongoUri = rawUri.trim().replace(/^["']|["']$/g, "");
if (mongoUri.endsWith("/")) {
  mongoUri += "smartexpenses?retryWrites=true&w=majority";
} else if (mongoUri.endsWith(".mongodb.net")) {
  mongoUri += "/smartexpenses?retryWrites=true&w=majority";
} else if (mongoUri.includes("mongodb.net/?")) {
  mongoUri = mongoUri.replace("mongodb.net/?", "mongodb.net/smartexpenses?");
}

async function syncToMongo() {
  console.log("🍃 Connecting to MongoDB Atlas cluster...");
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log("✅ Successfully connected to MongoDB Atlas!");

  const db = getDatabase();
  const s = db.sqlite;

  console.log("📦 Syncing Smart Expenses collections to MongoDB Atlas...");

  // 1. Categories
  const categories = s.prepare("SELECT * FROM categories").all();
  await MongoCategory.deleteMany({});
  await MongoCategory.insertMany(categories);
  console.log(`  ✓ Synced ${categories.length} categories`);

  // 2. Users
  const users = s.prepare("SELECT * FROM users").all();
  await MongoUser.deleteMany({});
  await MongoUser.insertMany(users);
  console.log(`  ✓ Synced ${users.length} users (demo account: demo@smartexpenses.app)`);

  // 3. Expenses
  const expenses = s.prepare("SELECT * FROM expenses").all();
  await MongoExpense.deleteMany({});
  const formattedExpenses = expenses.map((e) => {
    const splits = s.prepare("SELECT * FROM expense_splits WHERE expenseId = ?").all(e.id);
    return {
      _id: e.id,
      userId: e.userId,
      categoryId: e.categoryId,
      groupId: e.groupId || null,
      paidById: e.paidById,
      amount: Number(e.amount),
      description: e.description,
      date: new Date(e.date),
      paymentMethod: e.paymentMethod,
      notes: e.notes,
      isGroupExpense: Boolean(e.isGroupExpense),
      splits: splits.map((sp) => ({
        userId: sp.userId,
        amount: Number(sp.amount),
        percentage: Number(sp.percentage),
        isSettled: Boolean(sp.isSettled),
      })),
    };
  });
  await MongoExpense.insertMany(formattedExpenses);
  console.log(`  ✓ Synced ${formattedExpenses.length} expenses`);

  // 4. Budgets
  const budgets = s.prepare("SELECT * FROM budgets").all();
  await MongoBudget.deleteMany({});
  await MongoBudget.insertMany(
    budgets.map((b) => ({
      _id: b.id,
      userId: b.userId,
      categoryId: b.categoryId || null,
      month: b.month,
      year: b.year,
      amount: Number(b.amount),
    }))
  );
  console.log(`  ✓ Synced ${budgets.length} budgets`);

  // 5. Groups
  const groups = s.prepare("SELECT * FROM groups").all();
  await MongoGroup.deleteMany({});
  const formattedGroups = groups.map((g) => {
    const members = s.prepare(`
      SELECT gm.userId, gm.role, gm.joinedAt, u.name, u.email, u.avatar
      FROM group_memberships gm
      JOIN users u ON gm.userId = u.id
      WHERE gm.groupId = ?
    `).all(g.id);

    const settlements = s.prepare(`
      SELECT s.*, p.name as payerName, r.name as receiverName
      FROM settlements s
      JOIN users p ON s.payerId = p.id
      JOIN users r ON s.receiverId = r.id
      WHERE s.groupId = ?
    `).all(g.id);

    return {
      _id: g.id,
      name: g.name,
      description: g.description,
      createdById: g.createdById,
      members,
      settlements: settlements.map((st) => ({
        payerId: st.payerId,
        payerName: st.payerName,
        receiverId: st.receiverId,
        receiverName: st.receiverName,
        amount: Number(st.amount),
        notes: st.notes,
        date: new Date(st.date),
      })),
    };
  });
  await MongoGroup.insertMany(formattedGroups);
  console.log(`  ✓ Synced ${formattedGroups.length} shared groups`);

  // 6. Recurring
  const recurring = s.prepare("SELECT * FROM recurring_expenses").all();
  await MongoRecurring.deleteMany({});
  await MongoRecurring.insertMany(
    recurring.map((r) => ({
      _id: r.id,
      userId: r.userId,
      categoryId: r.categoryId,
      amount: Number(r.amount),
      description: r.description,
      frequency: r.frequency,
      startDate: new Date(r.startDate),
      nextDueDate: new Date(r.nextDueDate),
      isActive: Boolean(r.isActive),
      paymentMethod: r.paymentMethod,
    }))
  );
  console.log(`  ✓ Synced ${recurring.length} recurring rules`);

  // 7. Notifications
  const notifications = s.prepare("SELECT * FROM notifications").all();
  await MongoNotification.deleteMany({});
  await MongoNotification.insertMany(
    notifications.map((n) => ({
      _id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: Boolean(n.isRead),
      data: n.data,
    }))
  );
  console.log(`  ✓ Synced ${notifications.length} notifications`);

  console.log("\n🎉 ALL COLLECTIONS SUCCESSFULLY POPULATED IN MONGODB ATLAS!");
  console.log("\n👉 How to view in VS Code MongoDB Extension:");
  console.log("  1. In VS Code, click the MongoDB leaf icon in the left activity bar.");
  console.log("  2. Click 'Add Connection' / 'Connect with Connection String'.");
  console.log(`  3. Paste: ${mongoUri.replace(/:[^:]*@/, ":****@")}`);
  console.log("  4. You will see the database collections: users, expenses, budgets, groups, categories, recurring, notifications!");

  await mongoose.disconnect();
  process.exit(0);
}

syncToMongo().catch((err) => {
  console.error("❌ Failed to sync to MongoDB Atlas:", err.message);
  process.exit(1);
});
