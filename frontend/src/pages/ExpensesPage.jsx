import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Receipt,
  Download,
} from "lucide-react";
import { api } from "../api/client";
import { formatINR, formatRelativeDate } from "../utils/formatters";
import AddExpenseModal from "../components/AddExpenseModal";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [page, selectedCategory, startDate, endDate]);

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

  async function fetchExpenses() {
    setLoading(true);
    setError("");
    try {
      let query = `?page=${page}&limit=12`;
      if (selectedCategory) query += `&categoryId=${selectedCategory}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const data = await api.get(`/expenses${query}`);
      if (data.success) {
        setExpenses(data.expenses || []);
        setPagination(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      setError(err.message || "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  }

  async function handleDeleteConfirm() {
    if (!deletingExpense) return;
    try {
      await api.delete(`/expenses/${deletingExpense.id}`);
      setDeletingExpense(null);
      fetchExpenses();
    } catch (err) {
      alert("Failed to delete expense: " + err.message);
    }
  }

  async function handleExportCSV() {
    try {
      const blob = await api.get("/analytics/export");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smart-expenses-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to export expenses CSV");
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Personal Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filter, search, and manage all your stored transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 border border-slate-200/80 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, merchant, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              title="Start Date"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              title="End Date"
            />

            {(search || selectedCategory || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("");
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Expenses Table */}
      <div className="glass-card border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading expenses...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No expenses found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search criteria or log a new transaction.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Expense</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-800">{e.description}</div>
                      {e.notes && (
                        <div className="text-xs text-slate-400 line-clamp-1">{e.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                        <span>{e.category?.icon || "📦"}</span>
                        <span>{e.category?.name || "Uncategorized"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatRelativeDate(e.date)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {e.paymentMethod || "UPI"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      -{formatINR(e.amount)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingExpense(e);
                            setShowAddModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit expense"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingExpense(e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {expenses.length} of {pagination.total} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-slate-700">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add or Edit Modal */}
      {showAddModal && (
        <AddExpenseModal
          isOpen={showAddModal}
          initialData={editingExpense}
          onClose={() => {
            setShowAddModal(false);
            setEditingExpense(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingExpense(null);
            fetchExpenses();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Delete Expense?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Are you sure you want to delete "{deletingExpense.description}" for{" "}
              {formatINR(deletingExpense.amount)}? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingExpense(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
