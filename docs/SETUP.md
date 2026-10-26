# ENTP — Local Setup Guide

Follow this guide to get ENTP running on your local machine.

---

## 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **npm**: v9+ (or pnpm/yarn)
- **Git**
- *(Optional)* **PostgreSQL** v14+ or Docker (ENTP automatically falls back to an embedded ACID SQLite database if PostgreSQL is not running locally).

---

## 2. Clone and Setup Dependencies

```bash
git clone <repository-url>
cd entp
```

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd ../frontend
npm install
```

---

## 3. Environment Variables Configuration

### Backend
Copy `.env.example` in `backend/`:
```bash
cp backend/.env.example backend/.env
```
Default `backend/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super-secret-development-key-change-in-production
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/entp_db?schema=public
```

### Frontend
Copy `.env.example` in `frontend/`:
```bash
cp frontend/.env.example frontend/.env
```
Default `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Database Setup & Seeding

### Development Mode (Zero-Setup SQLite)
If you don't have PostgreSQL installed, ENTP automatically activates its embedded SQLite engine (`backend/data/entp.db`).

Seed sample demo data:
```bash
npm --prefix backend run db:seed
```

### Production / PostgreSQL Mode
1. Start PostgreSQL or run with Docker:
   ```bash
   docker run --name entp-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=entp_db -p 5432:5432 -d postgres:16
   ```
2. Run database migrations:
   ```bash
   npm --prefix backend run db:migrate
   ```
3. Seed fictional demo data:
   ```bash
   npm --prefix backend run db:seed
   ```

---

## 5. Starting the Application

You can start backend and frontend concurrently from the root directory or in separate terminal windows:

### Terminal 1 — Backend:
```bash
npm --prefix backend run dev
```
Backend runs at: **http://localhost:5000** (Health check: `http://localhost:5000/api/health`)

### Terminal 2 — Frontend:
```bash
npm --prefix frontend run dev
```
Frontend runs at: **http://localhost:5173**

---

## 6. Demo Account Credentials
- **Email**: `demo@entp.app`
- **Password**: `Password@123`
*(Or click the **"One-Click Demo Login"** button on the sign-in page)*

---

## 7. Running Automated Tests

Run backend API tests:
```bash
npm --prefix backend test
```

Run frontend unit & integration tests:
```bash
npm --prefix frontend test
```
