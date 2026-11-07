import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Users,
  Calendar,
  TrendingUp,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { user, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    try {
      await loginAsDemo();
      navigate("/dashboard");
    } catch {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-500/20">
              S
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Smart Expenses
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Tracker
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <button
                  onClick={handleDemoLogin}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/60 transition-all"
                >
                  <Sparkles size={15} />
                  Demo Mode
                </button>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm hover:shadow-md transition-all"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-400/15 via-purple-300/20 to-blue-300/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold mb-6">
            <Zap size={14} className="text-indigo-600" />
            Designed for Students, Professionals & Shared Living
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            Master your spending.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Split shared bills with zero stress.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed mb-10">
            Smart Expenses Tracker helps you record personal expenses in INR (₹), calculates
            your safe daily spending allowance, tracks category budgets, and
            settles roommate debts seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/25 transition-all"
            >
              Start Tracking Now
              <ArrowRight size={18} />
            </Link>

            <button
              onClick={handleDemoLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs hover:shadow-sm transition-all"
            >
              <Sparkles size={18} className="text-amber-500" />
              Explore Demo Experience
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" />
              100% Free & Open Architecture
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Secure HttpOnly Sessions
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Real-time Simplified Debt Graph
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Indian Rupee (₹) & Date Standards
            </span>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-16 p-3 sm:p-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-2xl shadow-indigo-950/5">
          <div className="rounded-2xl bg-slate-900 p-4 sm:p-8 text-white relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-3 text-xs text-slate-400 font-mono">
                  smartexpenses.app/dashboard
                </span>
              </div>

              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                ● Live Database Mode
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <span className="text-xs text-slate-400">Total Spent</span>
                <p className="text-2xl font-bold text-white mt-1">₹3,240</p>
                <span className="text-[11px] text-emerald-400 font-medium">
                  18 Transactions
                </span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <span className="text-xs text-slate-400">Remaining Budget</span>
                <p className="text-2xl font-bold text-indigo-400 mt-1">₹16,760</p>
                <span className="text-[11px] text-slate-400">
                  of ₹20,000 monthly
                </span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <span className="text-xs text-slate-400">Daily Allowance</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">₹558 / day</p>
                <span className="text-[11px] text-slate-400">
                  Remaining budget ÷ days left
                </span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <span className="text-xs text-slate-400">Roommate Net Balance</span>
                <p className="text-2xl font-bold text-amber-400 mt-1">+₹700</p>
                <span className="text-[11px] text-slate-400">
                  You are owed by flatmates
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center text-xs text-slate-400">
              Interactive dashboard loaded with Recharts category distributions, weekly spending velocity, and automated split settlement calculations.
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Everything you need in one organized platform.
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Built from the ground up for modern financial clarity, group accountability, and reliable budgeting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Dynamic Daily Allowance
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automatically divides your remaining budget by remaining days in the month, with instant feedback if spending accelerates too quickly.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Group Expenses & Debt Simplification
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Split rent, groceries, trips and outings equally or with custom percentages. Our debt engine eliminates circular transfers.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Recurring Subscriptions
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track weekly, monthly, or yearly recurring obligations like Netflix, gym memberships, and WiFi bills without double counting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
              S
            </div>
            <div>
              <p className="text-white font-bold text-sm">Smart Expenses Tracker</p>
              <p className="text-xs text-slate-500">
                © 2026 Smart Expenses Tracker. Modern Financial Management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-white transition-colors">
              Register
            </Link>
            <button
              onClick={handleDemoLogin}
              className="hover:text-white transition-colors"
            >
              Demo Access
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
