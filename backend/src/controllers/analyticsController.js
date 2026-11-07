const dbService = require("../services/dbService");

async function getDashboardSummary(req, res, next) {
  try {
    const summary = await dbService.getDashboardSummary(req.user.id);
    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    next(error);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const year = req.query.year || new Date().getFullYear();
    const analytics = await dbService.getAnalytics({
      userId: req.user.id,
      year: parseInt(year, 10),
    });
    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    next(error);
  }
}

async function exportExpensesCSV(req, res, next) {
  try {
    const { items } = await dbService.getExpenses({
      userId: req.user.id,
      limit: 10000,
      offset: 0,
    });

    const headers = ["ID", "Date", "Description", "Category", "Amount (INR)", "Payment Method", "Group", "Notes"];
    const rows = items.map((e) => [
      `"${e.id}"`,
      `"${new Date(e.date).toLocaleDateString("en-IN")}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`,
      `"${(e.category ? e.category.name : "Uncategorized").replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      `"${e.paymentMethod || "UPI"}"`,
      `"${e.group ? e.group.name.replace(/"/g, '""') : "Personal"}"`,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="smart-expenses-${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardSummary,
  getAnalytics,
  exportExpensesCSV,
};
