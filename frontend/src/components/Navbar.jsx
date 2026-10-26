import React, { useState } from "react";
import { Menu, Bell, Plus, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationModal from "./NotificationModal";
import AddExpenseModal from "./AddExpenseModal";

export default function Navbar({ onToggleSidebar, onExpenseAdded }) {
  const { user, unreadNotifications, refreshNotifications } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                {timeGreeting}
              </span>
              <Sparkles size={13} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {user?.name ? user.name.split(" ")[0] : "Welcome"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications Button */}
          <button
            onClick={() => {
              setShowNotifications(true);
              refreshNotifications();
            }}
            className="relative p-2.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:shadow-xs transition-all"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-indigo-600 rounded-full border-2 border-white">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Quick Add Expense */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </header>

      {/* Notification Drawer Modal */}
      {showNotifications && (
        <NotificationModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <AddExpenseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            if (onExpenseAdded) onExpenseAdded();
          }}
        />
      )}
    </>
  );
}
