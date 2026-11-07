import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Check current session on initial mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const data = await api.get("/auth/me");
      if (data.success && data.user) {
        setUser(data.user);
        fetchNotificationCount();
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem("smart_expenses_token");
      localStorage.removeItem("entp_token");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotificationCount() {
    try {
      const data = await api.get("/notifications");
      if (data.success && Array.isArray(data.notifications)) {
        const unread = data.notifications.filter((n) => !n.isRead).length;
        setUnreadNotifications(unread);
      }
    } catch (err) {
      // quiet fail
    }
  }

  async function login(email, password) {
    const data = await api.post("/auth/login", { email, password });
    if (data.success) {
      setUser(data.user);
      if (data.token) {
        localStorage.setItem("smart_expenses_token", data.token);
      }
      fetchNotificationCount();
    }
    return data;
  }

  async function signup(userData) {
    const data = await api.post("/auth/signup", userData);
    if (data.success) {
      setUser(data.user);
      if (data.token) {
        localStorage.setItem("smart_expenses_token", data.token);
      }
      fetchNotificationCount();
    }
    return data;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // ignore
    } finally {
      setUser(null);
      localStorage.removeItem("smart_expenses_token");
      localStorage.removeItem("entp_token");
    }
  }

  async function loginAsDemo() {
    return login("demo@smartexpenses.app", "Password@123");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        loginAsDemo,
        refreshUser: checkAuth,
        unreadNotifications,
        refreshNotifications: fetchNotificationCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
