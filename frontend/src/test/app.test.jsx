import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { formatINR, formatDate } from "../utils/formatters";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import { AuthProvider } from "../context/AuthContext";

describe("Smart Expenses Tracker Formatters", () => {
  it("formats Indian Rupee (INR) amounts correctly", () => {
    const formatted = formatINR(1500);
    expect(formatted).toContain("1,500");
    expect(formatted).toContain("₹");
  });

  it("formats Indian dates properly", () => {
    const formatted = formatDate("2026-10-26T12:00:00Z");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("Oct");
  });
});

describe("Landing Page Component", () => {
  it("renders Smart Expenses Tracker brand identity and hero call-to-action", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getAllByText(/Smart Expenses/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Master your spending/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Tracking Now/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore Demo Experience/i)).toBeInTheDocument();
  });
});

describe("Authentication Pages", () => {
  it("renders Login page with email, password, and demo login button", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /One-Click Demo Login/i })).toBeInTheDocument();
  });

  it("renders Register page with name, email, password, and confirmation", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByPlaceholderText(/Pranjal Manjare/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
  });
});
