const express = require("express");
const {
  getBudgets,
  upsertBudget,
  deleteBudget,
  upsertBudgetSchema,
} = require("../controllers/budgetController");
const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.get("/", getBudgets);
router.post("/", validate(upsertBudgetSchema), upsertBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
