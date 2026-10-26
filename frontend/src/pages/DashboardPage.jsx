import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "../api/client";
import { formatINR, formatRelativeDate } from "../utils/formatters";
import AddExpenseModal from "../components/AddExpenseModal";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/analytics/dashboard");
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl lg:col-span-2" />
          <div className="h-80 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 text-xs font-semibold bg-white border border-red-200 rounded-xl hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    monthSpend = 0,
    txCount = 0,
    todaySpend = 0,
    monthlyBudget = 0,
    remainingBudget = 0,
    dailyAllowance = 0,
    dailyAllowanceExplanation = "",
    categoryBreakdown = [],
    last7Days = [],
    recentExpenses = [],
    netGroupBalance = 0,
  } = summary || {};

  const budgetUsagePercent =
    monthlyBudget > 0 ? Math.min(Math.round((monthSpend / monthlyBudget) * 100), 999) : 0;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Financial Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time balance, budgets, and automated daily allowance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:shadow-xs transition-all"
            title="Refresh statistics"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs hover:shadow-sm transition-all"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Spent This Month */}
        <div className="glass-card p-5 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              This Month Spend
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingDown size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(monthSpend)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {txCount} {txCount === 1 ? "transaction" : "transactions"} logged
          </p>
        </div>

        {/* Monthly Budget & Remaining */}
        <div className="glass-card p-5 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Budget Health
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Wallet size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(remainingBudget)}
          </h3>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>{budgetUsagePercent}% used</span>
              <span>Budget: {formatINR(monthlyBudget)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetUsagePercent > 100
                    ? "bg-red-500"
                    : budgetUsagePercent > 80
                    ? "bg-amber-500"
                    : "bg-indigo-600"
                }`}
                style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Remaining Daily Allowance */}
        <div className="glass-card p-5 border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 relative">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Daily Allowance
              </span>
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label="Daily allowance explanation"
                >
                  <HelpCircle size={14} />
                </button>
                {showTooltip && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-20">
                    <p className="font-semibold text-indigo-300 mb-1">Calculation Rule:</p>
                    <p>{dailyAllowanceExplanation}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Sparkles size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            {formatINR(dailyAllowance)}
            <span className="text-xs text-slate-500 font-normal"> / day</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 truncate" title={dailyAllowanceExplanation}>
            {dailyAllowanceExplanation}
          </p>
        </div>

        {/* Group & Shared Debts Balance */}
        <div className="glass-card p-5 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Group Balance
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <h3
            className={`text-2xl font-extrabold tracking-tight ${
              netGroupBalance > 0
                ? "text-emerald-600"
                : netGroupBalance < 0
                ? "text-red-600"
                : "text-slate-700"
            }`}
          >
            {netGroupBalance > 0
              ? `+${formatINR(netGroupBalance)}`
              : formatINR(netGroupBalance)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {netGroupBalance > 0
              ? "You are owed by flatmates"
              : netGroupBalance < 0
              ? "You owe group members"
              : "All shared debts settled"}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Spending Velocity Bar Chart */}
        <div className="glass-card p-6 lg:col-span-2 border border-slate-200/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Spending Velocity</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Past 7 days personal expense distribution
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(val) => [formatINR(val), "Spent"]}
                  labelFormatter={(label) => `Day: ${label}`}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    color: "#fff",
                    borderRadius: "0.75rem",
                    border: "none",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="glass-card p-6 border border-slate-200/80 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-base">Category Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">Spending by category this month</p>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <PieChart size={36} className="mb-2 text-slate-300" />
              <p className="text-xs">No expense records this month</p>
            </div>
          ) : (
            <>
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="amount"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatINR(val), "Spent"]}
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        color: "#fff",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend list */}
              <div className="space-y-2 mt-4 max-h-36 overflow-y-auto">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-slate-700 truncate">{cat.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      {formatINR(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="glass-card p-6 border border-slate-200/80">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Recent Transactions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Your latest logged activity</p>
          </div>
          <Link
            to="/expenses"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View all expenses <ArrowRight size={14} />
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <p className="text-sm">No expenses recorded yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100"
            >
              Add First Expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentExpenses.map((exp) => (
              <div
                key={exp.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-2xs"
                    style={{ backgroundColor: `${exp.category?.color || "#6366f1"}15` }}
                  >
                    {exp.category?.icon || "💸"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {exp.description}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {exp.category?.name} • {formatRelativeDate(exp.date)} • {exp.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">
                    -{formatINR(exp.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <AddExpenseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
