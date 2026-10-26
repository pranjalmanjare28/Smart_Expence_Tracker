import React, { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import { formatINR, formatDate } from "../utils/formatters";

export default function RecurringPage() {
  const [recurring, setRecurring] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchRecurring();
  }, []);

  async function fetchCategories() {
    try {
      const data = await api.get("/expenses/categories");
      if (data.success && data.categories) {
        setCategories(data.categories);
        if (data.categories.length > 0 && !categoryId) {
          setCategoryId(data.categories[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchRecurring() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/recurring");
      if (data.success) {
        setRecurring(data.recurring || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load recurring expenses.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id, currentStatus) {
    try {
      await api.patch(`/recurring/${id}/toggle`, { isActive: !currentStatus });
      fetchRecurring();
    } catch (err) {
      alert("Failed to toggle: " + err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this recurring rule?")) return;
    try {
      await api.delete(`/recurring/${id}`);
      fetchRecurring();
    } catch (err) {
      alert("Failed to delete rule: " + err.message);
    }
  }

  async function handleProcessDue() {
    setProcessing(true);
    setProcessMessage("");
    try {
      const data = await api.post("/recurring/process");
      setProcessMessage(data.message);
      fetchRecurring();
    } catch (err) {
      setProcessMessage("Failed to process due expenses: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid positive amount.");
      return;
    }

    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/recurring", {
        amount: numAmount,
        description: description.trim(),
        categoryId,
        frequency,
        startDate: new Date(startDate).toISOString(),
        paymentMethod,
      });
      setShowModal(false);
      setAmount("");
      setDescription("");
      fetchRecurring();
    } catch (err) {
      setFormError(err.message || "Failed to create recurring rule.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Recurring Expenses & Subscriptions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automate routine commitments (Netflix, broadband, rent, gym)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleProcessDue}
            disabled={processing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-all disabled:opacity-50"
          >
            <Zap size={15} />
            {processing ? "Processing..." : "Process Due Expenses"}
          </button>
          <button
            onClick={() => {
              setFormError("");
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
          >
            <Plus size={16} />
            Add Rule
          </button>
        </div>
      </div>

      {processMessage && (
        <div className="p-3.5 text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl flex items-center justify-between">
          <span>{processMessage}</span>
          <button onClick={() => setProcessMessage("")} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Rules Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading recurring rules...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 text-sm">{error}</div>
      ) : recurring.length === 0 ? (
        <div className="glass-card p-12 text-center border border-slate-200/80">
          <Clock size={44} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 text-base">No Recurring Rules Created</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Set up automatic tracking for your streaming plans, flat rent, or utility bills.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
          >
            Create Your First Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recurring.map((r) => (
            <div
              key={r.id}
              className={`glass-card p-6 border transition-all ${
                r.isActive ? "border-slate-200/80" : "border-slate-200/40 opacity-60 bg-slate-50/50"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${r.categoryColor || "#6366f1"}15` }}
                  >
                    {r.categoryIcon || "💳"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{r.description}</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                      {r.frequency}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(r.id, r.isActive)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      r.isActive
                        ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                        : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                    title={r.isActive ? "Pause rule" : "Activate rule"}
                  >
                    {r.isActive ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Next Due Date</span>
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                    <Calendar size={13} className="text-indigo-500" />
                    {formatDate(r.nextDueDate)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Amount</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {formatINR(r.amount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Recurring Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Add Recurring Expense</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix 4K Plan, Gym Membership, House Rent"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Frequency *
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
