const { z } = require("zod");
const dbService = require("../services/dbService");

const createExpenseSchema = {
  body: z.object({
    amount: z.number().positive("Amount must be greater than 0").max(10000000, "Amount exceeds limit"),
    description: z.string().min(1, "Description is required").max(120),
    categoryId: z.string().min(1, "Category is required"),
    date: z.string().optional(),
    paymentMethod: z.enum(["UPI", "Cash", "Card", "NetBanking", "Other"]).optional().default("UPI"),
    notes: z.string().max(500).optional(),
    groupId: z.string().nullable().optional(),
  }),
};

const updateExpenseSchema = {
  body: z.object({
    amount: z.number().positive("Amount must be greater than 0").optional(),
    description: z.string().min(1).max(120).optional(),
    categoryId: z.string().min(1).optional(),
    date: z.string().optional(),
    paymentMethod: z.enum(["UPI", "Cash", "Card", "NetBanking", "Other"]).optional(),
    notes: z.string().max(500).optional(),
  }),
};

async function getCategories(req, res, next) {
  try {
    const categories = await dbService.getCategories();
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

async function getExpenses(req, res, next) {
  try {
    const { categoryId, search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageLimit;

    const { items, total } = await dbService.getExpenses({
      userId: req.user.id,
      categoryId,
      search,
      startDate,
      endDate,
      limit: pageLimit,
      offset,
    });

    res.json({
      success: true,
      expenses: items,
      pagination: {
        page: pageNum,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function createExpense(req, res, next) {
  try {
    const { amount, description, categoryId, date, paymentMethod, notes, groupId } = req.body;

    // Verify category exists
    const category = await dbService.findCategoryById(categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: "Invalid category ID." });
    }

    const expense = await dbService.createExpense({
      userId: req.user.id,
      categoryId,
      groupId: groupId || null,
      paidById: req.user.id,
      amount,
      description,
      date,
      paymentMethod,
      notes,
    });

    // Check if this expense pushed current month's budget over limit
    const expDate = date ? new Date(date) : new Date();
    const month = expDate.getMonth() + 1;
    const year = expDate.getFullYear();
    const budgets = await dbService.getBudgets(req.user.id, month, year);

    for (const b of budgets) {
      if (b.categoryId === categoryId || b.categoryId === null) {
        if (b.isExceeded) {
          await dbService.createNotification({
            userId: req.user.id,
            title: "Budget Exceeded Warning",
            message: `Your ${b.categoryName} spending (₹${b.spent.toFixed(2)}) has exceeded your budget of ₹${b.amount.toFixed(2)}.`,
            type: "BUDGET_ALERT",
          });
        } else if (b.isWarning) {
          await dbService.createNotification({
            userId: req.user.id,
            title: "Budget Alert",
            message: `You have consumed ${b.percentUsed}% of your ${b.categoryName} budget (₹${b.spent.toFixed(2)} / ₹${b.amount.toFixed(2)}).`,
            type: "BUDGET_ALERT",
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Expense created successfully.",
      expense,
    });
  } catch (error) {
    next(error);
  }
}

async function getExpenseById(req, res, next) {
  try {
    const expense = await dbService.findExpenseById(req.params.id, req.user.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found or unauthorized." });
    }
    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
}

async function updateExpense(req, res, next) {
  try {
    const updated = await dbService.updateExpense(req.params.id, req.user.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Expense not found or unauthorized." });
    }
    res.json({
      success: true,
      message: "Expense updated successfully.",
      expense: updated,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const deleted = await dbService.deleteExpense(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Expense not found or unauthorized." });
    }
    res.json({
      success: true,
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  getExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  createExpenseSchema,
  updateExpenseSchema,
};
