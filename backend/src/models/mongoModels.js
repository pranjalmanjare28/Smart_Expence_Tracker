const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "U" },
    currency: { type: String, default: "INR" },
    dateFormat: { type: String, default: "DD/MM/YYYY" },
  },
  { timestamps: true }
);

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    isDefault: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ExpenseSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    categoryId: { type: String, required: true },
    groupId: { type: String, default: null, index: true },
    paidById: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now, index: true },
    paymentMethod: { type: String, default: "UPI" },
    notes: { type: String, default: null },
    isGroupExpense: { type: Boolean, default: false },
    splits: [
      {
        userId: String,
        userName: String,
        amount: Number,
        percentage: Number,
        isSettled: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

const BudgetSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    categoryId: { type: String, default: null },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);
BudgetSchema.index({ userId: 1, month: 1, year: 1, categoryId: 1 }, { unique: true });

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    createdById: { type: String, required: true },
    members: [
      {
        userId: String,
        name: String,
        email: String,
        avatar: String,
        role: { type: String, default: "MEMBER" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    settlements: [
      {
        payerId: String,
        payerName: String,
        receiverId: String,
        receiverName: String,
        amount: Number,
        notes: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const RecurringExpenseSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    categoryId: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    frequency: { type: String, enum: ["WEEKLY", "MONTHLY", "YEARLY"], default: "MONTHLY" },
    startDate: { type: Date, default: Date.now },
    nextDueDate: { type: Date, required: true },
    lastPostedDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    paymentMethod: { type: String, default: "UPI" },
  },
  { timestamps: true }
);

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "SYSTEM" },
    isRead: { type: Boolean, default: false },
    data: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = {
  MongoUser: mongoose.models.User || mongoose.model("User", UserSchema),
  MongoCategory: mongoose.models.Category || mongoose.model("Category", CategorySchema),
  MongoExpense: mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema),
  MongoBudget: mongoose.models.Budget || mongoose.model("Budget", BudgetSchema),
  MongoGroup: mongoose.models.Group || mongoose.model("Group", GroupSchema),
  MongoRecurring: mongoose.models.Recurring || mongoose.model("Recurring", RecurringExpenseSchema),
  MongoNotification: mongoose.models.Notification || mongoose.model("Notification", NotificationSchema),
};
