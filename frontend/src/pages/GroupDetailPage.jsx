import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Plus,
  Receipt,
  ArrowRightLeft,
  CheckCircle,
  Users,
  Shield,
  Calendar,
} from "lucide-react";
import { api } from "../api/client";
import { formatINR, formatRelativeDate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expCategory, setExpCategory] = useState("");
  const [expPayer, setExpPayer] = useState("");
  const [splitMode, setSplitMode] = useState("EQUAL"); // 'EQUAL' or 'CUSTOM'
  const [customSplits, setCustomSplits] = useState({});
  const [expError, setExpError] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

  const [showSettlement, setShowSettlement] = useState(false);
  const [settlePayer, setSettlePayer] = useState("");
  const [settleReceiver, setSettleReceiver] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNotes, setSettleNotes] = useState("");
  const [settleError, setSettleError] = useState("");
  const [savingSettlement, setSavingSettlement] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
    fetchCategories();
  }, [id]);

  async function fetchCategories() {
    try {
      const data = await api.get("/expenses/categories");
      if (data.success) {
        setCategories(data.categories || []);
        if (data.categories.length > 0 && !expCategory) {
          setExpCategory(data.categories[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchGroupDetails() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get(`/groups/${id}`);
      if (data.success) {
        setGroup(data.group);
        if (data.group.members && data.group.members.length > 0) {
          setExpPayer(user?.id || data.group.members[0].userId);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load group details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    setMemberError("");
    setAddingMember(true);
    try {
      await api.post(`/groups/${id}/members`, { emailOrId: memberEmail.trim() });
      setShowAddMember(false);
      setMemberEmail("");
      fetchGroupDetails();
    } catch (err) {
      setMemberError(err.message || "Failed to add member.");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleCreateSharedExpense(e) {
    e.preventDefault();
    setExpError("");

    const total = parseFloat(expAmount);
    if (isNaN(total) || total <= 0) {
      setExpError("Please enter a valid positive amount.");
      return;
    }

    if (!expDesc.trim()) {
      setExpError("Expense description is required.");
      return;
    }

    const members = group.members || [];
    let splits = [];

    if (splitMode === "EQUAL") {
      const perPerson = Math.round((total / members.length) * 100) / 100;
      // Adjust last person's share for rounding
      let runningSum = 0;
      splits = members.map((m, idx) => {
        let share = perPerson;
        if (idx === members.length - 1) {
          share = Math.round((total - runningSum) * 100) / 100;
        } else {
          runningSum += perPerson;
        }
        return {
          userId: m.userId,
          amount: share,
          percentage: Math.round((share / total) * 100),
        };
      });
    } else {
      let customSum = 0;
      splits = members.map((m) => {
        const val = parseFloat(customSplits[m.userId] || 0);
        customSum += val;
        return {
          userId: m.userId,
          amount: val,
          percentage: total > 0 ? Math.round((val / total) * 100) : 0,
        };
      });

      if (Math.abs(customSum - total) > 0.05) {
        setExpError(
          `Sum of shares (₹${customSum.toFixed(2)}) must exactly equal total amount (₹${total.toFixed(2)}).`
        );
        return;
      }
    }

    setSavingExpense(true);
    try {
      await api.post(`/groups/${id}/expenses`, {
        amount: total,
        description: expDesc.trim(),
        categoryId: expCategory,
        paidById: expPayer,
        splits,
      });
      setShowAddExpense(false);
      setExpAmount("");
      setExpDesc("");
      setCustomSplits({});
      fetchGroupDetails();
    } catch (err) {
      setExpError(err.message || "Failed to add shared expense.");
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleRecordSettlement(e) {
    e.preventDefault();
    setSettleError("");

    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      setSettleError("Please enter a valid positive settlement amount.");
      return;
    }

    if (!settlePayer || !settleReceiver) {
      setSettleError("Payer and receiver are both required.");
      return;
    }

    if (settlePayer === settleReceiver) {
      setSettleError("Payer and receiver cannot be the same person.");
      return;
    }

    setSavingSettlement(true);
    try {
      await api.post(`/groups/${id}/settlements`, {
        payerId: settlePayer,
        receiverId: settleReceiver,
        amount,
        notes: settleNotes.trim() || undefined,
      });
      setShowSettlement(false);
      setSettleAmount("");
      setSettleNotes("");
      fetchGroupDetails();
    } catch (err) {
      setSettleError(err.message || "Failed to record settlement.");
    } finally {
      setSavingSettlement(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading group...</div>;
  }

  if (error || !group) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl bg-red-50 text-red-700">
          {error || "Group not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back link & Title */}
      <div className="space-y-3">
        <Link
          to="/groups"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={14} /> Back to all groups
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs"
            >
              <UserPlus size={15} />
              Add Member
            </button>
            <button
              onClick={() => {
                setExpError("");
                setShowAddExpense(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              <Plus size={16} />
              Add Group Expense
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Balances & Simplified Debts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simplified Debt Resolution ("Who Owes Whom") */}
        <div className="glass-card p-6 border border-slate-200/80 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Debt Simplification & Settlements
              </h3>
              <p className="text-xs text-slate-500">
                Calculated optimal transactions to balance all members
              </p>
            </div>

            <button
              onClick={() => {
                setSettleError("");
                setShowSettlement(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-xl hover:bg-indigo-100 transition-all"
            >
              <ArrowRightLeft size={14} /> Record Settlement
            </button>
          </div>

          {group.simplifiedDebts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700">All Balances Settled</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Nobody owes anything in this group right now!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {group.simplifiedDebts.map((d, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-slate-800">{d.fromUserName}</span>
                    <span className="text-xs text-slate-400">owes</span>
                    <span className="font-bold text-indigo-600">{d.toUserName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600 text-sm">
                      {formatINR(d.amount)}
                    </span>
                    <button
                      onClick={() => {
                        setSettlePayer(d.fromUserId);
                        setSettleReceiver(d.toUserId);
                        setSettleAmount(String(d.amount));
                        setSettleError("");
                        setShowSettlement(true);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                    >
                      Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Net Balances */}
        <div className="glass-card p-6 border border-slate-200/80">
          <h3 className="font-bold text-slate-800 text-base mb-1">Member Balances</h3>
          <p className="text-xs text-slate-500 mb-4">Net positions in group currency</p>

          <div className="space-y-3">
            {group.balances.map((b) => (
              <div key={b.userId} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-100 font-bold flex items-center justify-center text-[11px] text-slate-600 shrink-0">
                    {b.name[0]?.toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800 truncate">
                    {b.name} {b.userId === user?.id ? "(You)" : ""}
                  </span>
                </div>

                <span
                  className={`font-bold shrink-0 ${
                    b.netBalance > 0
                      ? "text-emerald-600"
                      : b.netBalance < 0
                      ? "text-red-600"
                      : "text-slate-500"
                  }`}
                >
                  {b.netBalance > 0 ? `+${formatINR(b.netBalance)}` : formatINR(b.netBalance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shared Expenses Log */}
      <div className="glass-card p-6 border border-slate-200/80">
        <h3 className="font-bold text-slate-800 text-base mb-1">Group Expense Log</h3>
        <p className="text-xs text-slate-500 mb-5">History of shared group purchases</p>

        {group.expenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Receipt size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No expenses logged in this group yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {group.expenses.map((e) => (
              <div key={e.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{e.categoryIcon || "🛍️"}</span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{e.description}</h4>
                      <p className="text-xs text-slate-400">
                        Paid by <span className="font-semibold text-slate-700">{e.paidByName}</span> • {formatRelativeDate(e.date)}
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900 text-base">
                    {formatINR(e.amount)}
                  </span>
                </div>

                {/* Split participant pill breakdown */}
                {e.splits && e.splits.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pl-11 pt-1">
                    {e.splits.map((s) => (
                      <span
                        key={s.id}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                      >
                        {s.userName}: {formatINR(s.amount)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-1">Add Group Member</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter registered member email or user ID
            </p>

            {memberError && (
              <div className="p-3 mb-3 text-xs text-red-700 bg-red-50 rounded-xl border border-red-200">
                {memberError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <input
                type="text"
                required
                placeholder="e.g. rahul@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
                >
                  {addingMember ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Shared Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Add Shared Expense</h3>
                <p className="text-xs text-slate-500">
                  Split among {group.members.length} members
                </p>
              </div>
              <button
                onClick={() => setShowAddExpense(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSharedExpense} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {expError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {expError}
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
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
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
                  placeholder="e.g. DMart Groceries, Wifi recharge, Dinner at Social"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
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
                    Paid By *
                  </label>
                  <select
                    value={expPayer}
                    onChange={(e) => setExpPayer(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {group.members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name} {m.userId === user?.id ? "(You)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Split Method
                </label>
                <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSplitMode("EQUAL")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      splitMode === "EQUAL" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    Equally (₹{(parseFloat(expAmount || 0) / group.members.length).toFixed(2)} each)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode("CUSTOM")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      splitMode === "CUSTOM" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    Custom Shares
                  </button>
                </div>
              </div>

              {/* Custom shares table */}
              {splitMode === "CUSTOM" && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <p className="font-semibold text-slate-700 mb-2">Specify Individual Amounts (₹):</p>
                  {group.members.map((m) => (
                    <div key={m.userId} className="flex items-center justify-between gap-3">
                      <span className="truncate">{m.name}:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={customSplits[m.userId] || ""}
                        onChange={(e) =>
                          setCustomSplits({ ...customSplits, [m.userId]: e.target.value })
                        }
                        className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-semibold"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
                >
                  {savingExpense ? "Recording..." : "Save Split Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Settlement Modal */}
      {showSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Record Settlement</h3>
              <button
                onClick={() => setShowSettlement(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} className="p-6 space-y-4">
              {settleError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {settleError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payer (Sent Money) *
                  </label>
                  <select
                    value={settlePayer}
                    onChange={(e) => setSettlePayer(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Select Payer</option>
                    {group.members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Receiver (Got Money) *
                  </label>
                  <select
                    value={settleReceiver}
                    onChange={(e) => setSettleReceiver(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">Select Receiver</option>
                    {group.members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount Settled (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notes (e.g. UPI Ref / GPay)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via Google Pay UPI"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettlement(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettlement}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
                >
                  {savingSettlement ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
