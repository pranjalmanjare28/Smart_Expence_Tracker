import React, { useState, useEffect } from "react";
import {
  Download,
  Calendar,
  PieChart as PieIcon,
  TrendingUp,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "../api/client";
import { formatINR } from "../utils/formatters";

export default function AnalyticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, [year]);

  async function fetchAnalytics() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/analytics/overview?year=${year}`);
      if (res.success) {
        setData(res.analytics);
      }
    } catch (err) {
      setError(err.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    try {
      const blob = await api.get("/analytics/export");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smart-expenses-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to export data: " + err.message);
    }
  }

  const { totalYearSpend = 0, monthlyTrends = [], categoryDistribution = [] } = data || {};

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Financial Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deep insights into monthly spending trends and annual budget adherence
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar size={15} className="text-slate-400" />
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
          >
            <Download size={15} />
            Export Stored CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading analytics...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 text-sm">{error}</div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-card p-5 border border-slate-200/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Annual Spending ({year})
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatINR(totalYearSpend)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Total recorded transactions in {year}
              </p>
            </div>

            <div className="glass-card p-5 border border-slate-200/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Monthly Average
              </span>
              <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">
                {formatINR(totalYearSpend / 12)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Average monthly spend pace
              </p>
            </div>

            <div className="glass-card p-5 border border-slate-200/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Top Spending Category
              </span>
              <h3 className="text-2xl font-extrabold text-purple-600 mt-1 truncate">
                {categoryDistribution[0]?.name || "N/A"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {categoryDistribution[0] ? formatINR(categoryDistribution[0].total) : "No data"}
              </p>
            </div>
          </div>

          {/* Monthly Comparison Bar Chart */}
          <div className="glass-card p-6 border border-slate-200/80">
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 text-base">
                12-Month Spending vs Budget Target
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare actual expenses against monthly allocated budgets
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val, name) => [formatINR(val), name === "spent" ? "Spent" : "Budget"]}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      borderRadius: "0.75rem",
                      border: "none",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="spent" name="Actual Spent" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget" name="Budget Limit" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="glass-card p-6 border border-slate-200/80">
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 text-base">
                Annual Category Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportion of funds allocated across categories
              </p>
            </div>

            {categoryDistribution.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No expense data recorded in {year}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="total"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [formatINR(val), "Total Spent"]}
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

                <div className="space-y-2.5">
                  {categoryDistribution.map((c) => {
                    const percent =
                      totalYearSpend > 0 ? Math.round((c.total / totalYearSpend) * 100) : 0;
                    return (
                      <div key={c.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="font-semibold text-slate-700">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{percent}%</span>
                          <span className="font-bold text-slate-900">{formatINR(c.total)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
