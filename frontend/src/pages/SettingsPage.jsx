import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Globe,
  Trash2,
  Check,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [currency, setCurrency] = useState(user?.currency || "INR");
  const [dateFormat, setDateFormat] = useState(user?.dateFormat || "DD/MM/YYYY");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Danger zone
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    setSavingProfile(true);

    try {
      await api.put("/auth/profile", {
        name: name.trim(),
        currency,
        dateFormat,
      });
      setProfileSuccess("Profile updated successfully!");
      refreshUser();
    } catch (err) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);

    try {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError("");

    if (deleteConfirmation !== "DELETE MY ACCOUNT") {
      setDeleteError("Please type the exact phrase 'DELETE MY ACCOUNT'.");
      return;
    }

    setDeleting(true);
    try {
      await api.delete("/auth/account", {
        body: { confirmation: deleteConfirmation },
      });
      await logout();
      navigate("/login");
    } catch (err) {
      setDeleteError(err.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Account & Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize your profile, update security credentials, and manage regional settings
        </p>
      </div>

      {/* Profile Form */}
      <div className="glass-card p-6 border border-slate-200/80">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Personal Information</h3>
            <p className="text-xs text-slate-500">Your public profile and contact email</p>
          </div>
        </div>

        {profileSuccess && (
          <div className="mb-4 p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
            {profileSuccess}
          </div>
        )}
        {profileError && (
          <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
            {profileError}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="INR">INR (₹) — Indian Rupee</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Date Display Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
            >
              <Check size={15} />
              {savingProfile ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="glass-card p-6 border border-slate-200/80">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Security & Password</h3>
            <p className="text-xs text-slate-500">Update your account authentication password</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mb-4 p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
            {passwordSuccess}
          </div>
        )}
        {passwordError && (
          <div className="mb-4 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
            >
              <Check size={15} />
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border border-red-200 bg-red-50/10">
        <div className="flex items-center gap-3 mb-4 text-red-600">
          <AlertTriangle size={22} />
          <h3 className="font-bold text-base">Danger Zone</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Permanently delete your Smart Expenses Tracker account and all personal expense history, budgets, and recurring rules.
          This action is immediate and non-reversible.
        </p>

        {deleteError && (
          <div className="mb-4 p-3 text-xs bg-red-100 text-red-800 rounded-xl">
            {deleteError}
          </div>
        )}

        <form onSubmit={handleDeleteAccount} className="space-y-3">
          <label className="block text-xs font-medium text-slate-700">
            To proceed, type <span className="font-bold text-red-600">DELETE MY ACCOUNT</span> below:
          </label>
          <input
            type="text"
            required
            placeholder="DELETE MY ACCOUNT"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-white border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <button
            type="submit"
            disabled={deleting || deleteConfirmation !== "DELETE MY ACCOUNT"}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs disabled:opacity-40"
          >
            <Trash2 size={15} />
            {deleting ? "Deleting..." : "Permanently Delete Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
