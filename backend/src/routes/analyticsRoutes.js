const express = require("express");
const {
  getDashboardSummary,
  getAnalytics,
  exportExpensesCSV,
} = require("../controllers/analyticsController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/dashboard", getDashboardSummary);
router.get("/overview", getAnalytics);
router.get("/export", exportExpensesCSV);

module.exports = router;
