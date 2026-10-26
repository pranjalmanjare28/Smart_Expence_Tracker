import React, { useState, useEffect } from "react";
import { X, CheckCheck, AlertCircle, Users, ArrowRightLeft, Bell } from "lucide-react";
import { api } from "../api/client";
import { formatRelativeDate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

export default function NotificationModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshNotifications } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const data = await api.get("/notifications");
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case "BUDGET_ALERT":
        return <AlertCircle size={18} className="text-amber-500" />;
      case "GROUP_EXPENSE":
        return <Users size={18} className="text-indigo-500" />;
      case "SETTLEMENT":
        return <ArrowRightLeft size={18} className="text-emerald-500" />;
      default:
        return <Bell size={18} className="text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-base">Notifications</h3>
            {notifications.some((n) => !n.isRead) && (
              <span className="px-2 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-full">
                New
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-3 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Loading alerts...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1">
                You're all caught up! Alerts on budgets and groups will appear here.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={`p-3 rounded-xl transition-colors flex items-start gap-3 cursor-pointer ${
                  n.isRead ? "bg-white hover:bg-slate-50" : "bg-indigo-50/40 hover:bg-indigo-50/70"
                }`}
              >
                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-xs mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-slate-800">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatRelativeDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
