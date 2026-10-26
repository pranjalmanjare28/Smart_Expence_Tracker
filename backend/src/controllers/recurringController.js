const { z } = require("zod");
const dbService = require("../services/dbService");

const createRecurringSchema = {
  body: z.object({
    amount: z.number().positive("Amount must be greater than 0"),
    description: z.string().min(1, "Description is required").max(120),
    categoryId: z.string().min(1, "Category is required"),
    frequency: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
    startDate: z.string().optional(),
    paymentMethod: z.enum(["UPI", "Cash", "Card", "NetBanking", "Other"]).optional().default("UPI"),
  }),
};

async function getRecurringExpenses(req, res, next) {
  try {
    const rules = await dbService.getRecurringExpenses(req.user.id);
    res.json({ success: true, recurring: rules });
  } catch (error) {
    next(error);
  }
}

async function createRecurringExpense(req, res, next) {
  try {
    const { amount, description, categoryId, frequency, startDate, paymentMethod } = req.body;
    const rules = await dbService.createRecurringExpense({
      userId: req.user.id,
      categoryId,
      amount,
      description,
      frequency,
      startDate,
      paymentMethod,
    });
    res.status(201).json({
      success: true,
      message: "Recurring rule created successfully.",
      recurring: rules,
    });
  } catch (error) {
    next(error);
  }
}

async function toggleRecurringExpense(req, res, next) {
  try {
    const { isActive } = req.body;
    await dbService.toggleRecurringExpense(req.params.id, req.user.id, isActive);
    res.json({ success: true, message: `Recurring expense ${isActive ? "activated" : "paused"}.` });
  } catch (error) {
    next(error);
  }
}

async function deleteRecurringExpense(req, res, next) {
  try {
    await dbService.deleteRecurringExpense(req.params.id, req.user.id);
    res.json({ success: true, message: "Recurring expense removed successfully." });
  } catch (error) {
    next(error);
  }
}

async function processDueExpenses(req, res, next) {
  try {
    const posted = await dbService.processDueRecurringExpenses(req.user.id);
    res.json({
      success: true,
      message: posted.length > 0
        ? `Processed ${posted.length} recurring expense(s) into transaction history.`
        : "No scheduled expenses due at this time.",
      posted,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRecurringExpenses,
  createRecurringExpense,
  toggleRecurringExpense,
  deleteRecurringExpense,
  processDueExpenses,
  createRecurringSchema,
};
