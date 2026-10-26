import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  Shield,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { api } from "../api/client";
import { formatINR } from "../utils/formatters";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/groups");
      if (data.success) {
        setGroups(data.groups || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load groups.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Group name is required.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/groups", {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setShowCreateModal(false);
      setName("");
      setDescription("");
      fetchGroups();
    } catch (err) {
      setFormError(err.message || "Failed to create group.");
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
            Groups & Bill Splitting
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage shared living expenses, apartment rent, trips, and group settlements
          </p>
        </div>

        <button
          onClick={() => {
            setFormError("");
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
        >
          <Plus size={16} />
          Create Group
        </button>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading shared groups...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 text-sm">{error}</div>
      ) : groups.length === 0 ? (
        <div className="glass-card p-12 text-center border border-slate-200/80">
          <Users size={44} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 text-base">No Groups Joined Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create a group for your apartment flatmates, trip with friends, or colleagues to split shared bills with zero calculation hassle.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
          >
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((g) => (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="glass-card p-6 border border-slate-200/80 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                    {g.name[0]?.toUpperCase()}
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-slate-100 text-slate-600">
                    {g.role}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                  {g.name}
                </h3>
                {g.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {g.description}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <UserCheck size={15} className="text-slate-400" />
                  <span>{g.memberCount} members</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  <span>Open details</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Create Group</h3>
                <p className="text-xs text-slate-500">
                  Shared expenses and automated split tracking
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 402 Roommates, Goa Trip 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Purpose (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Shared grocery, electricity and broadband expenses"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
