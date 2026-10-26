# ENTP — Database Architecture & Setup Guide

ENTP uses a normalized, production-grade relational database schema powered by **PostgreSQL** and **Prisma ORM**, with an automatic local ACID engine fallback (SQLite) for seamless zero-setup development.

---

## 1. Schema Design

All monetary amounts are strictly stored as `NUMERIC(12, 2)` / `DECIMAL(12, 2)` to avoid floating-point inaccuracies. Identifiers use UUIDs. Foreign key relations enforce referential integrity with appropriate cascading rules.

### Core Tables & Models

1. **`users`**
   - `id`: UUID (Primary Key)
   - `name`: User full name
   - `email`: Normalized unique email address
   - `password`: Salted bcrypt hash
   - `avatar`: Initials or avatar URL
   - `currency`: Default `INR` (₹)
   - `dateFormat`: Default `DD/MM/YYYY`
   - `createdAt`, `updatedAt`: Timestamps

2. **`categories`**
   - `id`: Category ID
   - `name`: Category name (Food, Transport, Shopping, Entertainment, Education, Bills, Healthcare, Other)
   - `icon`: Emoji or icon identifier
   - `color`: Hex color accent
   - `isDefault`: Boolean

3. **`expenses`**
   - `id`: UUID (Primary Key)
   - `userId`: Creator / owner ID (Foreign Key -> `users.id`)
   - `categoryId`: Foreign Key -> `categories.id`
   - `groupId`: Optional Foreign Key -> `groups.id`
   - `paidById`: User ID who paid (Foreign Key -> `users.id`)
   - `amount`: `DECIMAL(12, 2)`
   - `description`: Expense title / vendor
   - `date`: ISO timestamp of transaction
   - `paymentMethod`: `UPI`, `Cash`, `Card`, `NetBanking`, `Other`
   - `notes`: Optional detailed note
   - `isGroupExpense`: Boolean flag

4. **`budgets`**
   - `id`: UUID (Primary Key)
   - `userId`: Owner (Foreign Key -> `users.id`)
   - `categoryId`: Optional Foreign Key -> `categories.id` (NULL represents overall monthly budget)
   - `month`: 1 - 12
   - `year`: 4-digit year (e.g. 2026)
   - `amount`: `DECIMAL(12, 2)`
   - *Constraint*: `UNIQUE(userId, month, year, categoryId)`

5. **`groups`**
   - `id`: UUID (Primary Key)
   - `name`: Group name (e.g. "Flat 402", "Manali Roadtrip")
   - `description`: Purpose of the group
   - `createdById`: Creator user ID

6. **`group_memberships`**
   - `id`: UUID (Primary Key)
   - `groupId`: Foreign Key -> `groups.id`
   - `userId`: Foreign Key -> `users.id`
   - `role`: `ADMIN` or `MEMBER`
   - *Constraint*: `UNIQUE(groupId, userId)`

7. **`expense_splits`**
   - `id`: UUID (Primary Key)
   - `expenseId`: Foreign Key -> `expenses.id`
   - `userId`: Participant user ID (Foreign Key -> `users.id`)
   - `amount`: Exact split share in `DECIMAL(12, 2)`
   - `percentage`: Share percentage (optional)
   - `isSettled`: Boolean

8. **`settlements`**
   - `id`: UUID (Primary Key)
   - `groupId`: Foreign Key -> `groups.id`
   - `payerId`: User who paid back (Foreign Key -> `users.id`)
   - `receiverId`: User who received funds (Foreign Key -> `users.id`)
   - `amount`: Settled amount `DECIMAL(12, 2)`
   - `date`: Date of settlement
   - `notes`: Optional settlement notes

9. **`recurring_expenses`**
   - `id`: UUID (Primary Key)
   - `userId`: Owner (Foreign Key -> `users.id`)
   - `categoryId`: Foreign Key -> `categories.id`
   - `amount`: `DECIMAL(12, 2)`
   - `description`: Service name (e.g. Netflix, Rent, Wifi)
   - `frequency`: `WEEKLY`, `MONTHLY`, `YEARLY`
   - `startDate`: Start date
   - `nextDueDate`: Next scheduled occurrence
   - `isActive`: Boolean

10. **`notifications`**
    - `id`: UUID (Primary Key)
    - `userId`: User recipient
    - `title`, `message`: Notification content
    - `type`: `BUDGET_ALERT`, `GROUP_EXPENSE`, `SETTLEMENT`, `RECURRING_DUE`, `SYSTEM`
    - `isRead`: Boolean

11. **`sessions`**
    - `id`: UUID (Primary Key)
    - `userId`: Associated user
    - `token`: Unique cryptographic session / refresh identifier
    - `expiresAt`: Timestamp

---

## 2. PostgreSQL Setup & Migrations

### Prerequisites
Install PostgreSQL locally or run via Docker:
```bash
docker run --name entp-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=entp_db -p 5432:5432 -d postgres:16
```

### Configure Environment
In `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/entp_db?schema=public"
```

### Apply Migrations
```bash
# Apply schema to PostgreSQL
npm --prefix backend run db:migrate

# Or push schema directly
npm --prefix backend run db:push
```

### Seed Development Data
```bash
npm --prefix backend run db:seed
```

---

## 3. Resilient Local Development Mode

If PostgreSQL is not running on port 5432, ENTP automatically activates its embedded local ACID SQLite engine (`backend/data/entp.db`) with identical relational schemas, foreign keys, and indexes. When ready to transition to PostgreSQL, simply configure `DATABASE_URL` in `backend/.env` and run migrations.
