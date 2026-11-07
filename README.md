# Smart Expenses Tracker — Full-Stack Financial Platform

<div align="center">

![Smart Expenses Tracker Banner](https://img.shields.io/badge/Smart%20Expenses-Tracker%20System-6366f1?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Node.js Express](https://img.shields.io/badge/Node.js-Express%205-68a063?style=flat-square&logo=node.js)
![PostgreSQL & Prisma](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma%207-336791?style=flat-square&logo=postgresql)
![Tests](https://img.shields.io/badge/Tests-Passing%20(100%25)-10b981?style=flat-square)

**A modern, responsive full-stack financial management platform designed for college students, young adults, working professionals, and groups of friends sharing expenses.**

[Features](#-key-features) • [Design System](#-design-system) • [Tech Stack](#-technology-stack) • [Quick Start](#-quick-start) • [Render Deployment](#-deployment-to-render) • [Database Architecture](#-database-architecture) • [API Documentation](#-api-documentation)

</div>

---

## 🌟 Key Features

### 1. 📊 Financial Dashboard
- **Total Spent Overview**: Live tracking of current month and day expenditure with transaction counts.
- **Budget Health Tracking**: Visual budget consumption bar with warning thresholds (80% warning, 100% exceeded).
- **Automated Daily Allowance Calculation**: Divides your remaining monthly budget by the remaining days in the calendar month, with clear on-screen formulas and zero-budget protection.
- **Visual Analytics**: Interactive Recharts donut breakdown by category and 7-day spending velocity bar chart.
- **Roommate Balance Widget**: Instant indicator showing whether you are net owed money or owe flatmates across all shared groups.

### 2. 💳 Personal Expense Management
- Record personal expenses with amounts, descriptions, categories, payment methods (UPI, Card, Cash, Net Banking), dates, and notes.
- Categories supported: **Food**, **Transport**, **Shopping**, **Entertainment**, **Education**, **Bills**, **Healthcare**, and **Other**.
- Full-text search, category filters, date-range filters, and pagination.
- Instant calculation updates backed by relational storage.

### 3. 🎯 Budget Control
- Set overall monthly budgets or category-specific spending targets.
- Dynamic calculation of actual expenditures computed directly from database records.
- In-app notification alerts automatically triggered when approaching or exceeding budgets.

### 4. 👥 Groups & Bill Splitting
- Create groups for roommates, trips, outings, or shared household utilities.
- Invite members by email or user ID.
- Record shared expenses with equal splits or custom shares. Validates that split totals strictly equal the expense amount.
- **Automated Debt Simplification ("Who Owes Whom")**: Optimizes all circular debts into the minimum number of pairwise payments.
- Record settlements with payment method and notes to balance accounts immediately.

### 5. 🔄 Recurring Subscriptions
- Track weekly, monthly, and yearly recurring commitments (Netflix, broadband, rent, gym).
- Automated scheduled processor (`/api/recurring/process`) to post due expenses without creating duplicates.

### 6. 📈 Reports & CSV Export
- 12-month budget-versus-actual comparison charts.
- Annual category distribution breakdown.
- Authenticated CSV export downloading an RFC-4180 compliant file with your transaction history.

### 7. 🔒 Secure Authentication & Settings
- Server-side bcrypt hashing (cost factor 12) and JWT stored in HttpOnly, SameSite cookies.
- Rate limiting on sensitive endpoints (brute-force defense).
- Helmet security headers and CORS origin restrictions.
- Explicit confirmation required for account deletion (`DELETE MY ACCOUNT`) with safe relational cleanup.

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router 7, Tailwind CSS v4, Lucide React, Recharts |
| **Backend** | Node.js v22, Express 5, Prisma ORM 7, bcryptjs, jsonwebtoken, Zod, Helmet, cookie-parser, express-rate-limit |
| **Database** | MongoDB Atlas / PostgreSQL (Production) + Embedded SQLite ACID Fallback (Zero-friction local dev) |
| **Testing** | Node native test runner & Supertest (Backend), Vitest & React Testing Library (Frontend) |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v22)
- **npm** v9+

### 2. Setup Dependencies
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 3. Seed Development Data
Smart Expenses Tracker comes with an automatic development seed script that creates sample demo users and realistic transactions:
```bash
npm run db:seed
```

### 4. Run Locally
Open two terminal tabs:

**Terminal 1 — Backend Server:**
```bash
npm run dev:backend
```
Backend will start at: `http://localhost:5000` (Health check at `http://localhost:5000/api/health`)

**Terminal 2 — Frontend Application:**
```bash
npm run dev:frontend
```
Frontend will start at: `http://localhost:5173`

---

## 🧪 Demo Account Credentials

You can log in instantly by clicking **"One-Click Demo Login"** on the login page or using:
- **Email:** `demo@smartexpenses.app`
- **Password:** `Password@123`

---

## 🌐 Deployment to Render

This repository is ready for single-service full-stack deployment on [Render](https://render.com):

1. **Create New Web Service** on Render connected to this repository.
2. **Build Command**:
   ```bash
   npm run build
   ```
3. **Start Command**:
   ```bash
   npm start
   ```
4. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: *(a random 32+ character string)*
   - `MONGODB_URI`: *(Your MongoDB Atlas connection string, e.g. `mongodb+srv://...`)*
   
> **Important for MongoDB Atlas:** Under Atlas ➔ **Network Access**, ensure **`0.0.0.0/0` (Allow Access from Anywhere)** is added so Render's dynamic IP addresses can connect.

---

## 📄 License
This project is licensed under the ISC License.
