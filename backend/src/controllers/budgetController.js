const { z } = require("zod");
const dbService = require("../services/dbService");

const upsertBudgetSchema = {
  body: z.object({
    amount: z.number().positive("Budget amount must be greater than 0"),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100),
    categoryId: z.string().nullable().optional(),
  }),
};

async function getBudgets(req, res, next) {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();

    const budgets = await dbService.getBudgets(req.user.id, month, year);

    res.json({
      success: true,
      month,
      year,
      budgets,
    });
  } catch (error) {
    next(error);
  }
}

async function upsertBudget(req, res, next) {
  try {
    const { amount, month, year, categoryId } = req.body;

    const budget = await dbService.upsertBudget({
      userId: req.user.id,
      categoryId: categoryId || null,
      month,
      year,
      amount,
    });

    res.status(200).json({
      success: true,
      message: "Budget saved successfully.",
      budget,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteBudget(req, res, next) {
  try {
    const deleted = await dbService.deleteBudget(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Budget not found or unauthorized." });
    }
    res.json({
      success: true,
      message: "Budget removed successfully.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getBudgets,
  upsertBudget,
  deleteBudget,
  upsertBudgetSchema,
};
