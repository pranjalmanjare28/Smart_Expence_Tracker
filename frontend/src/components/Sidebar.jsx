import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Users,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Expenses", path: "/expenses", icon: Receipt },
    { name: "Budgets", path: "/budgets", icon: PieChart },
    { name: "Groups & Splits", path: "/groups", icon: Users },
    { name: "Recurring", path: "/recurring", icon: Clock },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const isDemo = user?.email === "demo@smartexpenses.app" || user?.email === "demo@entp.app";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-500/20">
                S
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-base leading-tight tracking-tight">
                  Smart Expenses
                </h1>
                <p className="text-[10px] font-semibold tracking-wider text-indigo-600 uppercase">
                  Tracker
                </p>
              </div>
            </div>

            {/* Close button on mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
              aria-label="Close navigation"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Demo Mode Notice Badge */}
          {isDemo && (
            <div className="mx-4 mt-4 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-800 text-xs">
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold">Demo Account Active</span>
                <p className="text-[10px] text-amber-700">Realistic sample data loaded</p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? "bg-indigo-50/80 text-indigo-700 font-semibold shadow-xs"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Profile and Logout Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-semibold flex items-center justify-center text-sm shadow-sm shrink-0">
                {user?.avatar || user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
