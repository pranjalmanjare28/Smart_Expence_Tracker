const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const { PrismaClient } = require("@prisma/client");

let prisma = null;
let sqliteDb = null;
let activeEngine = "sqlite"; // 'postgres' | 'sqlite'

// Initialize SQLite store as resilient local ACID engine
function initSqlite() {
  const dataDir = path.join(__dirname, "../../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "entp.db");
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  sqliteDb.transaction = (fn) => (...args) => {
    sqliteDb.exec("BEGIN TRANSACTION;");
    try {
      const res = fn(...args);
      sqliteDb.exec("COMMIT;");
      return res;
    } catch (err) {
      sqliteDb.exec("ROLLBACK;");
      throw err;
    }
  };

  // Create tables matching Prisma PostgreSQL schema
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      avatar TEXT,
      currency TEXT NOT NULL DEFAULT 'INR',
      dateFormat TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      isDefault INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      groupId TEXT,
      paidById TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      paymentMethod TEXT NOT NULL DEFAULT 'UPI',
      notes TEXT,
      isGroupExpense INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories (id),
      FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE CASCADE,
      FOREIGN KEY (paidById) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      categoryId TEXT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      amount NUMERIC NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE CASCADE,
      UNIQUE (userId, month, year, categoryId)
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      createdById TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdById) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS group_memberships (
      id TEXT PRIMARY KEY,
      groupId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      joinedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE (groupId, userId)
    );

    CREATE TABLE IF NOT EXISTS expense_splits (
      id TEXT PRIMARY KEY,
      expenseId TEXT NOT NULL,
      userId TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      percentage NUMERIC,
      isSettled INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expenseId) REFERENCES expenses (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE (expenseId, userId)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      groupId TEXT NOT NULL,
      payerId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE CASCADE,
      FOREIGN KEY (payerId) REFERENCES users (id),
      FOREIGN KEY (receiverId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS recurring_expenses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      description TEXT NOT NULL,
      frequency TEXT NOT NULL,
      startDate TEXT NOT NULL,
      nextDueDate TEXT NOT NULL,
      lastPostedDate TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      paymentMethod TEXT NOT NULL DEFAULT 'UPI',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (categoryId) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      isRead INTEGER NOT NULL DEFAULT 0,
      data TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  // Seed default categories if missing
  const count = sqliteDb.prepare("SELECT COUNT(*) as count FROM categories").get().count;
  if (count === 0) {
    const insertCat = sqliteDb.prepare(
      "INSERT INTO categories (id, name, icon, color, isDefault) VALUES (?, ?, ?, ?, 1)"
    );
    const defaults = [
      { id: "cat-food", name: "Food", icon: "🍔", color: "#f59e0b" },
      { id: "cat-transport", name: "Transport", icon: "🚌", color: "#3b82f6" },
      { id: "cat-shopping", name: "Shopping", icon: "🛍️", color: "#ec4899" },
      { id: "cat-entertainment", name: "Entertainment", icon: "🎬", color: "#8b5cf6" },
      { id: "cat-education", name: "Education", icon: "📚", color: "#10b981" },
      { id: "cat-bills", name: "Bills", icon: "💡", color: "#ef4444" },
      { id: "cat-healthcare", name: "Healthcare", icon: "💊", color: "#06b6d4" },
      { id: "cat-other", name: "Other", icon: "📦", color: "#64748b" },
    ];
    for (const c of defaults) {
      insertCat.run(c.id, c.name, c.icon, c.color);
    }
  }
}

// Attempt PostgreSQL connection via Prisma
async function checkDatabaseConnection() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && (mongoUri.startsWith("mongodb://") || mongoUri.startsWith("mongodb+srv://"))) {
    try {
      const mongoose = require("mongoose");
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log("🍃 [Database] Connected to MongoDB Atlas cluster!");
    } catch (err) {
      console.warn("⚠️ [Database Notice] MongoDB Atlas connection error:", err.message);
    }
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !databaseUrl.includes("localhost:5432/entp_db")) {
    try {
      prisma = new PrismaClient();
      await prisma.$connect();
      activeEngine = "postgres";
      console.log("✅ [Database] Successfully connected to PostgreSQL via Prisma.");
      return { success: true, engine: "postgres" };
    } catch (err) {
      console.warn("⚠️ [Database Notice] Could not connect to PostgreSQL via Prisma:", err.message);
      console.warn("ℹ️ [Database Notice] Falling back to local ACID database (SQLite) for zero downtime.");
      prisma = null;
    }
  }

  // Fallback to SQLite
  initSqlite();
  activeEngine = "sqlite";
  console.log("⚡ [Database] Local ACID SQLite database engine active (data/entp.db). Full PostgreSQL migration ready via 'npm run db:migrate'.");
  return { success: true, engine: "sqlite" };
}

function getDatabase() {
  if (activeEngine === "sqlite" && !sqliteDb) {
    initSqlite();
  }
  return {
    engine: activeEngine,
    prisma,
    sqlite: sqliteDb,
  };
}

module.exports = {
  checkDatabaseConnection,
  getDatabase,
  initSqlite,
};
