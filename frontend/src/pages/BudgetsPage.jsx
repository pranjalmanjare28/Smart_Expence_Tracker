import React,
{ useState, useEffect } from "react";
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  PieChart as PieIcon,
  Trash2,
  Calendar,
} from "lucide-react";
import { api } from "../api/client";
import { formatINR } from "../utils/formatters";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [showModal, setShowModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(""); // "" means overall monthly
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  async function fetchCategories() {
    try {
      const data = await api.get("/expenses/categories");
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchBudgets() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get(`/budgets?month=${month}&year=${year}`);
      if (data.success) {
        setBudgets(data.budgets || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load budgets.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBudget(e) {
    e.preventDefault();
    setFormError("");

    const numAmount = parseFloat(budgetAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid positive budget amount.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/budgets", {
        amount: numAmount,
        month,
        year,
        categoryId: selectedCategory || null,
      });
      setShowModal(false);
      setBudgetAmount("");
      setSelectedCategory("");
      fetchBudgets();
    } catch (err) {
      setFormError(err.message || "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBudget(id) {
    if (!window.confirm("Are you sure you want to remove this budget?")) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      alert("Failed to delete budget: " + err.message);
    }
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Budget Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control personal spending limits and monitor category health
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar size={15} className="text-slate-400" />
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
            >
              {months.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none border-l border-slate-200 pl-2"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setFormError("");
              setBudgetAmount("");
              setSelectedCategory("");
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
          >
            <Plus size={16} />
            Set Budget
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading budgets...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 text-sm">{error}</div>
      ) : budgets.length === 0 ? (
        <div className="glass-card p-12 text-center border border-slate-200/80">
          <PieIcon size={44} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 text-base">No Budgets Configured for {months[month - 1]} {year}</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Set an overall monthly spending limit or category-specific goals (Food, Transport, Shopping) to keep your finances safe.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const isExceeded = b.spent > b.amount;
            const isWarning = b.percentUsed >= 80 && !isExceeded;

            return (
              <div
                key={b.id}
                className={`glass-card p-6 border transition-all ${
                  isExceeded
                    ? "border-red-200 bg-red-50/20"
                    : isWarning
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-slate-200/80"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${b.categoryColor || "#6366f1"}15` }}
                    >
                      {b.categoryIcon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        {b.categoryName}
                      </h3>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {b.categoryId ? "Category Budget" : "Overall Limit"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                    title="Remove budget"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Amounts */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Spent:</span>
                    <span className="font-bold text-slate-900 text-lg">
                      {formatINR(b.spent)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-slate-500">
                    <span>Target Budget:</span>
                    <span>{formatINR(b.amount)}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-500">Remaining:</span>
                    <span
                      className={`font-semibold ${
                        isExceeded ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {formatINR(b.remaining)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span
                      className={
                        isExceeded
                          ? "text-red-600"
                          : isWarning
                          ? "text-amber-600"
                          : "text-slate-600"
                      }
                    >
                      {b.percentUsed}% used
                    </span>
                    {isExceeded ? (
                      <span className="flex items-center gap-1 text-[11px] text-red-600">
                        <AlertTriangle size={12} /> Exceeded!
                      </span>
                    ) : isWarning ? (
                      <span className="flex items-center gap-1 text-[11px] text-amber-600">
                        <AlertCircle size={12} /> Approaching limit
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                        <CheckCircle size={12} /> On track
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isExceeded
                          ? "bg-red-500"
                          : isWarning
                          ? "bg-amber-500"
                          : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Set Budget</h3>
                <p className="text-xs text-slate-500">
                  For {months[month - 1]} {year}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Scope
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">💰 Overall Monthly Budget</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name} Specific Budget
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Budget Amount (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="e.g. 15000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
