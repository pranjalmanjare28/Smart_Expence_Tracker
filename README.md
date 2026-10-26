# ENTP — Expense Tracker System

<div align="center">

![ENTP Banner](https://img.shields.io/badge/ENTP-Expense%20Tracker%20System-6366f1?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Node.js Express](https://img.shields.io/badge/Node.js-Express%205-68a063?style=flat-square&logo=node.js)
![PostgreSQL & Prisma](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma%207-336791?style=flat-square&logo=postgresql)
![Tests](https://img.shields.io/badge/Tests-Passing%20(100%25)-10b981?style=flat-square)

**A modern, responsive full-stack financial management platform designed for college students, young adults, working professionals, and groups of friends sharing expenses.**

[Features](#-key-features) • [Design System](#-design-system) • [Tech Stack](#-technology-stack) • [Quick Start](#-quick-start) • [Database Architecture](#-database-architecture) • [Testing](#-testing--quality) • [API Documentation](#-api-documentation)

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
- Instant calculation updates backed by PostgreSQL/relational storage.

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

## 🎨 Design System

Designed around a modern financial palette:
- **Soft Lavender** (`#8B5CF6`, `#F5F3FF`)
- **Warm Off-White** (`#F8FAFC`, `#F1F5F9`)
- **Muted Blue** (`#3B82F6`)
- **Subtle Mint** (`#10B981`)
- **Glassmorphic Paneling**: Subtle translucent backdrops (`rgba(255, 255, 255, 0.85)` with backdrop blur), rounded cards (`rounded-2xl`), accessible color contrast, and responsive collapsible navigation.
- **Currency & Regional Formats**: Strict Indian Rupee formatting (`₹#,##,###.##`) and Indian date format (`DD/MM/YYYY`).

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router 7, Tailwind CSS v4, Lucide React, Recharts |
| **Backend** | Node.js v22, Express 5, Prisma ORM 7, bcryptjs, jsonwebtoken, Zod, Helmet, cookie-parser, express-rate-limit |
| **Database** | PostgreSQL (Production) + Embedded SQLite ACID Fallback (Zero-friction local dev) |
| **Testing** | Node native test runner & Supertest (Backend), Vitest & React Testing Library (Frontend) |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v22)
- **npm** v9+

### 2. Clone and Setup Dependencies
```bash
git clone https://github.com/your-username/entp.git
cd entp
```

Install backend dependencies:
```bash
npm --prefix backend install
```

Install frontend dependencies:
```bash
npm --prefix frontend install
```

### 3. Setup Environment Variables
```bash
# In backend/
copy backend\.env.example backend\.env

# In frontend/
copy frontend\.env.example frontend\.env
```

### 4. Seed Development Data
ENTP comes with an automatic development seed script that creates sample demo users and realistic transactions:
```bash
npm --prefix backend run db:seed
```

### 5. Run the Application
Open two terminal tabs:

**Terminal 1 — Backend Server:**
```bash
npm --prefix backend run dev
```
Backend will start at: `http://localhost:5000` (Health check at `http://localhost:5000/api/health`)

**Terminal 2 — Frontend Application:**
```bash
npm --prefix frontend run dev
```
Frontend will start at: `http://localhost:5173`

---

## 🧪 Demo Account Credentials

You can log in instantly by clicking **"One-Click Demo Login"** on the login page or using:
- **Email:** `demo@entp.app`
- **Password:** `Password@123`

---

## 🗄️ Database Architecture

ENTP's schema is normalized and models relational finance:
- `users`: Credentials, preferences (currency, date format), avatars.
- `categories`: Pre-seeded default categories with icons and colors.
- `expenses`: Personal and shared expenses with `DECIMAL(12, 2)` monetary precision.
- `budgets`: Monthly and category-specific targets with unique constraints `(userId, month, year, categoryId)`.
- `groups`: Shared flatmate/friend groups.
- `group_memberships`: Membership roles (`ADMIN`, `MEMBER`).
- `expense_splits`: Exact participant shares with validation.
- `settlements`: Recorded debt payments between group members.
- `recurring_expenses`: Scheduled expense rules with frequencies.
- `notifications`: User alert notifications.

### PostgreSQL Migrations & Setup
If running PostgreSQL via Docker or local service:
```bash
docker run --name entp-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=entp_db -p 5432:5432 -d postgres:16
```
Configure `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/entp_db?schema=public"
```
Run migrations:
```bash
npm --prefix backend run db:migrate
```
*Note: If PostgreSQL is not running, ENTP seamlessly defaults to its embedded local ACID SQLite engine (`backend/data/entp.db`) so development never blocks!*

---

## 🧪 Testing & Quality

### Run Backend API Tests
Runs 16 comprehensive integration tests verifying auth, Zod validation, expense CRUD, security data isolation, budget calculations, and debt simplification:
```bash
npm --prefix backend test
```
Result: **16/16 Passed (100%)**

### Run Frontend Unit Tests
Runs Vitest tests verifying Indian currency formatters, date formatters, Landing page, Login page, and Register page:
```bash
npm --prefix frontend test
```
Result: **5/5 Passed (100%)**

### Verify Frontend Production Build
```bash
npm --prefix frontend run build
```
Result: **Built in < 7s with 0 errors**

---

## 📖 API Documentation

Detailed endpoint specifications with request and response payloads are available in:
- [API Reference Documentation](docs/API.md)
- [Database Setup Guide](docs/DATABASE.md)
- [Local Development Setup](docs/SETUP.md)

---

## 🛡️ Security Features
- **HttpOnly Cookies**: Prevents client-side XSS access to authentication tokens.
- **Rate Limiting**: Protects `/api/auth/login` and `/api/auth/signup` from brute-force attacks.
- **Password Hashing**: `bcryptjs` with salt work factor 12.
- **Data Isolation**: Database queries enforce user ownership (`userId`) so no user can access or manipulate another user's financial records.
- **Sanitized Inputs & Zod Validation**: Strict schema validation on incoming request payloads.

---

## 📄 License
This project is licensed under the ISC License.
