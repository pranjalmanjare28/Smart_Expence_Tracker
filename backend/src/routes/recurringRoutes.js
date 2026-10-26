const express = require("express");
const {
  getRecurringExpenses,
  createRecurringExpense,
  toggleRecurringExpense,
  deleteRecurringExpense,
  processDueExpenses,
  createRecurringSchema,
} = require("../controllers/recurringController");
const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.get("/", getRecurringExpenses);
router.post("/", validate(createRecurringSchema), createRecurringExpense);
router.patch("/:id/toggle", toggleRecurringExpense);
router.delete("/:id", deleteRecurringExpense);
router.post("/process", processDueExpenses);

module.exports = router;
