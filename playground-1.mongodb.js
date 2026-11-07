/* global use, db */
// MongoDB Playground for Smart Expenses Tracker
// Connect your MongoDB Atlas cluster in the VS Code MongoDB Extension, then click "Play" ▶ to run this file!

// Select the database
use('smartexpenses');

// 1. View all recorded expenses
console.log("=== Recent Expenses ===");
db.getCollection('expenses').find().sort({ date: -1 }).limit(5);

// 2. View all user accounts (including demo user)
console.log("=== User Accounts ===");
db.getCollection('users').find({}, { password: 0 });

// 3. View active budgets
console.log("=== Monthly Budgets ===");
db.getCollection('budgets').find();

// 4. View shared groups & flatmate splits
console.log("=== Shared Groups & Settlements ===");
db.getCollection('groups').find();

// 5. Total spending aggregation by category
console.log("=== Spending Summary by Category ===");
db.getCollection('expenses').aggregate([
  {
    $group: {
      _id: '$categoryId',
      totalSpent: { $sum: '$amount' },
      count: { $sum: 1 },
    },
  },
  { $sort: { totalSpent: -1 } },
]);
