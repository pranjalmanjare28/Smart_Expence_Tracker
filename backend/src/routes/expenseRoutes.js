const express = require("express");
const {
  getCategories,
  getExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  createExpenseSchema,
  updateExpenseSchema,
} = require("../controllers/expenseController");
const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.get("/categories", getCategories);
router.get("/", getExpenses);
router.post("/", validate(createExpenseSchema), createExpense);
router.get("/:id", getExpenseById);
router.put("/:id", validate(updateExpenseSchema), updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
