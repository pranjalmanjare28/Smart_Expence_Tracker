# Smart Expenses Tracker — API Reference Documentation

All endpoints (except public auth & health) require an active session via an HttpOnly cookie (`token`) or an `Authorization: Bearer <token>` header. Responses follow a standardized JSON envelope format.

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/signup`
Creates a new user account, sets an HttpOnly session cookie, and returns the user object.
- **Rate Limit**: 20 requests per 15 minutes.
- **Request Body**:
  ```json
  {
    "name": "Pranjal Manjare",
    "email": "pranjal@example.com",
    "password": "Password@123",
    "passwordConfirmation": "Password@123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Account created successfully.",
    "user": { "id": "...", "name": "...", "email": "...", "currency": "INR", "dateFormat": "DD/MM/YYYY" },
    "token": "..."
  }
  ```

### `POST /api/auth/login`
Authenticates a user and sets an HttpOnly session cookie.
- **Rate Limit**: 20 requests per 15 minutes.
- **Request Body**:
  ```json
  {
    "email": "demo@smartexpenses.app",
    "password": "Password@123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": { "id": "...", "name": "...", "email": "..." },
    "token": "..."
  }
  ```

### `POST /api/auth/logout`
Clears the session cookie.
- **Response `200 OK`**: `{ "success": true, "message": "Logged out successfully." }`

### `GET /api/auth/me`
Retrieves the currently authenticated user's profile.
- **Response `200 OK`**: `{ "success": true, "user": { ... } }`

### `PUT /api/auth/profile`
Updates user name, currency, or date display format.
- **Request Body**: `{ "name": "New Name", "currency": "INR", "dateFormat": "DD/MM/YYYY" }`

### `PUT /api/auth/change-password`
Changes account password.
- **Request Body**: `{ "currentPassword": "...", "newPassword": "..." }`

### `DELETE /api/auth/account`
Permanently deletes the account and cascades related records.
- **Request Body**: `{ "confirmation": "DELETE MY ACCOUNT" }`

---

## 2. Expenses Endpoints (`/api/expenses`)

### `GET /api/expenses`
Lists user's expenses with filtering, sorting, and pagination.
- **Query Parameters**:
  - `page`: default `1`
  - `limit`: default `20` (max `100`)
  - `categoryId`: optional category UUID
  - `search`: optional substring search in descriptions
  - `startDate`: ISO date string
  - `endDate`: ISO date string
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "expenses": [
      {
        "id": "...",
        "amount": 340,
        "description": "Lunch at Café Coffee Day",
        "date": "2026-10-26T12:00:00.000Z",
        "paymentMethod": "UPI",
        "category": { "name": "Food", "icon": "🍔", "color": "#f59e0b" }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
  ```

### `POST /api/expenses`
Records a new personal expense. Checks and triggers in-app budget alerts if spending crosses 80% or 100%.
- **Request Body**:
  ```json
  {
    "amount": 450,
    "description": "Subway lunch",
    "categoryId": "cat-food",
    "paymentMethod": "UPI",
    "date": "2026-10-26T12:00:00.000Z",
    "notes": "Healthy wrap"
  }
  ```

### `PUT /api/expenses/:id`
Updates an existing expense owned by the authenticated user.

### `DELETE /api/expenses/:id`
Deletes an expense.

### `GET /api/expenses/categories`
Returns all active categories with icons and color accents.

---

## 3. Budget Endpoints (`/api/budgets`)

### `GET /api/budgets?month=10&year=2026`
Returns active budgets for the given month with dynamically calculated actual spending from database records, remaining amount, and percentage utilized.

### `POST /api/budgets`
Creates or updates a monthly or category-specific budget.
- **Request Body**:
  ```json
  {
    "amount": 20000,
    "month": 10,
    "year": 2026,
    "categoryId": null
  }
  ```

### `DELETE /api/budgets/:id`
Removes a budget entry.

---

## 4. Groups & Bill Splitting (`/api/groups`)

### `GET /api/groups`
Lists all groups the authenticated user is a member of.

### `POST /api/groups`
Creates a group and sets the creator as `ADMIN`.
- **Request Body**: `{ "name": "Apartment 402", "description": "Flat rent and bills" }`

### `GET /api/groups/:id`
Returns full group details, member balances, simplified debt settlements ("who owes whom"), and expense log.

### `POST /api/groups/:id/members`
Adds a member to the group via their email or UUID.

### `POST /api/groups/:id/expenses`
Records a shared expense with equal or custom shares.
- **Request Body**:
  ```json
  {
    "amount": 1200,
    "description": "DMart Groceries",
    "categoryId": "cat-food",
    "paidById": "user-uuid",
    "splits": [
      { "userId": "user-1", "amount": 600, "percentage": 50 },
      { "userId": "user-2", "amount": 600, "percentage": 50 }
    ]
  }
  ```

### `POST /api/groups/:id/settlements`
Records a debt settlement payment between two members.
- **Request Body**:
  ```json
  {
    "payerId": "user-1",
    "receiverId": "user-2",
    "amount": 600,
    "notes": "Paid via Google Pay UPI"
  }
  ```

---

## 5. Recurring Expenses (`/api/recurring`)

- `GET /api/recurring`: Lists recurring rules.
- `POST /api/recurring`: Creates recurring rule (`WEEKLY`, `MONTHLY`, `YEARLY`).
- `PATCH /api/recurring/:id/toggle`: Toggles rule between active and paused.
- `DELETE /api/recurring/:id`: Deletes rule.
- `POST /api/recurring/process`: Evaluates and posts due expenses into transaction history.

---

## 6. Analytics & Reports (`/api/analytics`)

- `GET /api/analytics/dashboard`: Returns summary stats: month spend, budget health, daily allowance calculation, last 7 days velocity, and net group balances.
- `GET /api/analytics/overview?year=2026`: 12-month spending vs budget and category distribution.
- `GET /api/analytics/export`: Downloads authenticated user's expense history as an RFC 4180 CSV file.

---

## 7. Notifications (`/api/notifications`)

- `GET /api/notifications`: Returns user's in-app alerts.
- `PUT /api/notifications/:id/read`: Marks a single notification as read.
- `PUT /api/notifications/read-all`: Marks all notifications as read.

---

## 8. Health (`/api/health`)

- `GET /api/health`: Public system health check. Returns uptime and active database engine.
