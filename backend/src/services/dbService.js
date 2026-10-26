const { v4: uuidv4 } = require("crypto").randomUUID ? { v4: require("crypto").randomUUID } : { v4: () => Math.random().toString(36).substring(2) + Date.now().toString(36) };
const { getDatabase } = require("../config/db");

// ==========================================
// DB SERVICE - UNIFIED DATA ACCESS LAYER
// ==========================================

const dbService = {
  // ---- USERS ----
  async findUserByEmail(email) {
    const { engine, prisma, sqlite } = getDatabase();
    const normalized = email.trim().toLowerCase();
    if (engine === "postgres" && prisma) {
      return prisma.user.findUnique({ where: { email: normalized } });
    }
    const user = sqlite.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(normalized);
    return user || null;
  },

  async findUserById(id) {
    const { engine, prisma, sqlite } = getDatabase();
    if (engine === "postgres" && prisma) {
      return prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, avatar: true, currency: true, dateFormat: true, createdAt: true },
      });
    }
    const user = sqlite.prepare("SELECT id, name, email, avatar, currency, dateFormat, createdAt FROM users WHERE id = ?").get(id);
    return user || null;
  },

  async createUser({ name, email, password, avatar }) {
    const { engine, prisma, sqlite } = getDatabase();
    const id = uuidv4();
    const normalized = email.trim().toLowerCase();
    const now = new Date().toISOString();

    if (engine === "postgres" && prisma) {
      return prisma.user.create({
        data: { id, name: name.trim(), email: normalized, password, avatar: avatar || name[0].toUpperCase() },
      });
    }

    sqlite.prepare(`
      INSERT INTO users (id, name, email, password, avatar, currency, dateFormat, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'INR', 'DD/MM/YYYY', ?, ?)
    `).run(id, name.trim(), normalized, password, avatar || name.trim()[0].toUpperCase(), now, now);

    return this.findUserById(id);
  },

  async updateUser(id, data) {
    const { engine, prisma, sqlite } = getDatabase();
    const now = new Date().toISOString();
    if (engine === "postgres" && prisma) {
      return prisma.user.update({ where: { id }, data });
    }
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
    fields.push("updatedAt = ?");
    values.push(now);
    values.push(id);
    sqlite.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return this.findUserById(id);
  },

  async deleteUser(id) {
    const { engine, prisma, sqlite } = getDatabase();
    if (engine === "postgres" && prisma) {
      return prisma.user.delete({ where: { id } });
    }
    return sqlite.prepare("DELETE FROM users WHERE id = ?").run(id);
  },

  // ---- CATEGORIES ----
  async getCategories() {
    const { engine, prisma, sqlite } = getDatabase();
    if (engine === "postgres" && prisma) {
      return prisma.category.findMany({ orderBy: { name: "asc" } });
    }
    return sqlite.prepare("SELECT * FROM categories ORDER BY name ASC").all();
  },

  async findCategoryById(id) {
    const { engine, prisma, sqlite } = getDatabase();
    if (engine === "postgres" && prisma) {
      return prisma.category.findUnique({ where: { id } });
    }
    return sqlite.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  },

  // ---- EXPENSES ----
  async getExpenses({ userId, categoryId, search, startDate, endDate, limit = 50, offset = 0 }) {
    const { engine, prisma, sqlite } = getDatabase();
    if (engine === "postgres" && prisma) {
      const where = { userId };
      if (categoryId) where.categoryId = categoryId;
      if (search) where.description = { contains: search, mode: "insensitive" };
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }
      const [items, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          include: { category: true, group: true },
          orderBy: { date: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.expense.count({ where }),
      ]);
      return { items, total };
    }

    let query = `
      SELECT e.*, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor,
             g.name as groupName
      FROM expenses e
      JOIN categories c ON e.categoryId = c.id
      LEFT JOIN groups g ON e.groupId = g.id
      WHERE e.userId = ?
    `;
    const params = [userId];

    if (categoryId) {
      query += ` AND e.categoryId = ?`;
      params.push(categoryId);
    }
    if (search) {
      query += ` AND LOWER(e.description) LIKE ?`;
      params.push(`%${search.toLowerCase()}%`);
    }
    if (startDate) {
      query += ` AND e.date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND e.date <= ?`;
      params.push(endDate);
    }

    let countQuery = `
      SELECT COUNT(*) as count
      FROM expenses e
      WHERE e.userId = ?
    `;
    const countParams = [userId];

    if (categoryId) {
      countQuery += ` AND e.categoryId = ?`;
      countParams.push(categoryId);
    }
    if (search) {
      countQuery += ` AND LOWER(e.description) LIKE ?`;
      countParams.push(`%${search.toLowerCase()}%`);
    }
    if (startDate) {
      countQuery += ` AND e.date >= ?`;
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ` AND e.date <= ?`;
      countParams.push(endDate);
    }

    const total = sqlite.prepare(countQuery).get(...countParams).count;

    query += ` ORDER BY e.date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = sqlite.prepare(query).all(...params);
    const items = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      categoryId: r.categoryId,
      groupId: r.groupId,
      paidById: r.paidById,
      amount: Number(r.amount),
      description: r.description,
      date: r.date,
      paymentMethod: r.paymentMethod,
      notes: r.notes,
      isGroupExpense: Boolean(r.isGroupExpense),
      createdAt: r.createdAt,
      category: { id: r.categoryId, name: r.categoryName, icon: r.categoryIcon, color: r.categoryColor },
      group: r.groupName ? { id: r.groupId, name: r.groupName } : null,
    }));

    return { items, total };
  },

  async createExpense({ userId, categoryId, groupId = null, paidById, amount, description, date, paymentMethod, notes, isGroupExpense = false }) {
    const { engine, prisma, sqlite } = getDatabase();
    const id = uuidv4();
    const expenseDate = date ? new Date(date).toISOString() : new Date().toISOString();
    const now = new Date().toISOString();
    const payer = paidById || userId;

    if (engine === "postgres" && prisma) {
      return prisma.expense.create({
        data: {
          id,
          userId,
          categoryId,
          groupId,
          paidById: payer,
          amount,
          description: description.trim(),
          date: new Date(expenseDate),
          paymentMethod: paymentMethod || "UPI",
          notes: notes ? notes.trim() : null,
          isGroupExpense: Boolean(isGroupExpense),
        },
        include: { category: true, group: true },
      });
    }

    sqlite.prepare(`
      INSERT INTO expenses (id, userId, categoryId, groupId, paidById, amount, description, date, paymentMethod, notes, isGroupExpense, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, categoryId, groupId, payer, amount, description.trim(), expenseDate, paymentMethod || "UPI", notes ? notes.trim() : null, isGroupExpense ? 1 : 0, now, now);

    return this.findExpenseById(id, userId);
  },

  async findExpenseById(id, userId) {
    const { engine, prisma, sqlite } = getDatabase();
    if (engine === "postgres" && prisma) {
      return prisma.expense.findFirst({
        where: { id, userId },
        include: { category: true, group: true, splits: true },
      });
    }
    const r = sqlite.prepare(`
      SELECT e.*, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor,
             g.name as groupName
      FROM expenses e
      JOIN categories c ON e.categoryId = c.id
      LEFT JOIN groups g ON e.groupId = g.id
      WHERE e.id = ? AND (e.userId = ? OR e.paidById = ?)
    `).get(id, userId, userId);

    if (!r) return null;
    return {
      id: r.id,
      userId: r.userId,
      categoryId: r.categoryId,
      groupId: r.groupId,
      paidById: r.paidById,
      amount: Number(r.amount),
      description: r.description,
      date: r.date,
      paymentMethod: r.paymentMethod,
      notes: r.notes,
      isGroupExpense: Boolean(r.isGroupExpense),
      createdAt: r.createdAt,
      category: { id: r.categoryId, name: r.categoryName, icon: r.categoryIcon, color: r.categoryColor },
      group: r.groupName ? { id: r.groupId, name: r.groupName } : null,
    };
  },

  async updateExpense(id, userId, data) {
    const { engine, prisma, sqlite } = getDatabase();
    const existing = await this.findExpenseById(id, userId);
    if (!existing) return null;

    const now = new Date().toISOString();
    if (engine === "postgres" && prisma) {
      return prisma.expense.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
        include: { category: true, group: true },
      });
    }

    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(data)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    fields.push("updatedAt = ?");
    values.push(now);
    values.push(id);
    values.push(userId);

    sqlite.prepare(`UPDATE expenses SET ${fields.join(", ")} WHERE id = ? AND userId = ?`).run(...values);
    return this.findExpenseById(id, userId);
  },

  async deleteExpense(id, userId) {
    const { engine, prisma, sqlite } = getDatabase();
    const existing = await this.findExpenseById(id, userId);
    if (!existing) return false;

    if (engine === "postgres" && prisma) {
      await prisma.expense.delete({ where: { id } });
      return true;
    }

    sqlite.prepare("DELETE FROM expenses WHERE id = ? AND userId = ?").run(id, userId);
    return true;
  },

  // ---- BUDGETS ----
  async getBudgets(userId, month, year) {
    const { engine, prisma, sqlite } = getDatabase();
    const m = Number(month);
    const y = Number(year);

    // Calculate spent per category and overall in the month
    const startOfMonth = new Date(Date.UTC(y, m - 1, 1)).toISOString();
    const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)).toISOString();

    if (engine === "postgres" && prisma) {
      const budgets = await prisma.budget.findMany({
        where: { userId, month: m, year: y },
        include: { category: true },
      });
      return budgets;
    }

    const budgets = sqlite.prepare(`
      SELECT b.*, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor
      FROM budgets b
      LEFT JOIN categories c ON b.categoryId = c.id
      WHERE b.userId = ? AND b.month = ? AND b.year = ?
    `).all(userId, m, y);

    // Get spending for this period
    const spentByCategory = sqlite.prepare(`
      SELECT categoryId, SUM(amount) as totalSpent
      FROM expenses
      WHERE userId = ? AND date >= ? AND date <= ?
      GROUP BY categoryId
    `).all(userId, startOfMonth, endOfMonth);

    const spentMap = {};
    let totalSpentMonth = 0;
    for (const s of spentByCategory) {
      spentMap[s.categoryId] = Number(s.totalSpent);
      totalSpentMonth += Number(s.totalSpent);
    }

    return budgets.map((b) => {
      const budgetAmount = Number(b.amount);
      const spent = b.categoryId ? (spentMap[b.categoryId] || 0) : totalSpentMonth;
      const remaining = budgetAmount - spent;
      const percentUsed = budgetAmount > 0 ? Math.min(Math.round((spent / budgetAmount) * 100), 999) : 0;
      return {
        id: b.id,
        userId: b.userId,
        categoryId: b.categoryId,
        categoryName: b.categoryName || "Overall Monthly",
        categoryIcon: b.categoryIcon || "💰",
        categoryColor: b.categoryColor || "#6366f1",
        month: b.month,
        year: b.year,
        amount: budgetAmount,
        spent,
        remaining,
        percentUsed,
        isExceeded: spent > budgetAmount,
        isWarning: percentUsed >= 80 && percentUsed <= 100,
      };
    });
  },

  async upsertBudget({ userId, categoryId = null, month, year, amount }) {
    const { engine, prisma, sqlite } = getDatabase();
    const m = Number(month);
    const y = Number(year);
    const amt = Number(amount);
    const id = uuidv4();
    const now = new Date().toISOString();

    if (engine === "postgres" && prisma) {
      return prisma.budget.upsert({
        where: {
          userId_month_year_categoryId: {
            userId,
            month: m,
            year: y,
            categoryId: categoryId || null,
          },
        },
        update: { amount: amt, updatedAt: new Date() },
        create: { id, userId, categoryId: categoryId || null, month: m, year: y, amount: amt },
      });
    }

    const existing = sqlite.prepare(`
      SELECT id FROM budgets
      WHERE userId = ? AND month = ? AND year = ? AND (categoryId = ? OR (categoryId IS NULL AND ? IS NULL))
    `).get(userId, m, y, categoryId, categoryId);

    if (existing) {
      sqlite.prepare("UPDATE budgets SET amount = ?, updatedAt = ? WHERE id = ?").run(amt, now, existing.id);
      return { id: existing.id, userId, categoryId, month: m, year: y, amount: amt };
    }

    sqlite.prepare(`
      INSERT INTO budgets (id, userId, categoryId, month, year, amount, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, categoryId, m, y, amt, now, now);

    return { id, userId, categoryId, month: m, year: y, amount: amt };
  },

  async deleteBudget(id, userId) {
    const { engine, prisma, sqlite } = getDatabase();
    if (engine === "postgres" && prisma) {
      const b = await prisma.budget.findFirst({ where: { id, userId } });
      if (!b) return false;
      await prisma.budget.delete({ where: { id } });
      return true;
    }
    const res = sqlite.prepare("DELETE FROM budgets WHERE id = ? AND userId = ?").run(id, userId);
    return res.changes > 0;
  },

  // ---- GROUPS & SPLITS ----
  async getGroups(userId) {
    const { engine, prisma, sqlite } = getDatabase();
    if (engine === "postgres" && prisma) {
      return prisma.group.findMany({
        where: { members: { some: { userId } } },
        include: { members: { include: { user: true } }, expenses: true },
      });
    }

    const memberships = sqlite.prepare(`
      SELECT g.*, gm.role,
             (SELECT COUNT(*) FROM group_memberships WHERE groupId = g.id) as memberCount,
             (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE groupId = g.id) as totalGroupSpend
      FROM groups g
      JOIN group_memberships gm ON g.id = gm.groupId
      WHERE gm.userId = ?
      ORDER BY g.createdAt DESC
    `).all(userId);

    return memberships.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      createdById: g.createdById,
      role: g.role,
      memberCount: Number(g.memberCount),
      totalSpend: Number(g.totalGroupSpend),
      createdAt: g.createdAt,
    }));
  },

  async createGroup({ name, description, userId }) {
    const { sqlite } = getDatabase();
    const id = uuidv4();
    const memId = uuidv4();
    const now = new Date().toISOString();

    const insertGroup = sqlite.prepare(`
      INSERT INTO groups (id, name, description, createdById, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertMember = sqlite.prepare(`
      INSERT INTO group_memberships (id, groupId, userId, role, joinedAt)
      VALUES (?, ?, ?, 'ADMIN', ?)
    `);

    sqlite.transaction(() => {
      insertGroup.run(id, name.trim(), description ? description.trim() : null, userId, now, now);
      insertMember.run(memId, id, userId, now);
    })();

    return this.getGroupById(id, userId);
  },

  async getGroupById(groupId, userId) {
    const { sqlite } = getDatabase();
    const membership = sqlite.prepare("SELECT role FROM group_memberships WHERE groupId = ? AND userId = ?").get(groupId, userId);
    if (!membership) return null;

    const group = sqlite.prepare("SELECT * FROM groups WHERE id = ?").get(groupId);
    if (!group) return null;

    const members = sqlite.prepare(`
      SELECT gm.id as membershipId, gm.role, gm.joinedAt,
             u.id as userId, u.name, u.email, u.avatar
      FROM group_memberships gm
      JOIN users u ON gm.userId = u.id
      WHERE gm.groupId = ?
    `).all(groupId);

    const expenses = sqlite.prepare(`
      SELECT e.*, u.name as paidByName, u.avatar as paidByAvatar,
             c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor
      FROM expenses e
      JOIN users u ON e.paidById = u.id
      JOIN categories c ON e.categoryId = c.id
      WHERE e.groupId = ?
      ORDER BY e.date DESC
    `).all(groupId);

    const expenseIds = expenses.map((e) => e.id);
    let splitsByExpense = {};
    if (expenseIds.length > 0) {
      const placeholders = expenseIds.map(() => "?").join(",");
      const splits = sqlite.prepare(`
        SELECT s.*, u.name as userName, u.email as userEmail
        FROM expense_splits s
        JOIN users u ON s.userId = u.id
        WHERE s.expenseId IN (${placeholders})
      `).all(...expenseIds);

      for (const sp of splits) {
        if (!splitsByExpense[sp.expenseId]) splitsByExpense[sp.expenseId] = [];
        splitsByExpense[sp.expenseId].push({
          id: sp.id,
          userId: sp.userId,
          userName: sp.userName,
          amount: Number(sp.amount),
          percentage: Number(sp.percentage),
          isSettled: Boolean(sp.isSettled),
        });
      }
    }

    const settlements = sqlite.prepare(`
      SELECT s.*, p.name as payerName, r.name as receiverName
      FROM settlements s
      JOIN users p ON s.payerId = p.id
      JOIN users r ON s.receiverId = r.id
      WHERE s.groupId = ?
      ORDER BY s.date DESC
    `).all(groupId);

    // Calculate net debt balance matrix for members
    // netBalance = (Amount paid for others) - (Amount owed for others)
    const balances = {};
    for (const m of members) {
      balances[m.userId] = { userId: m.userId, name: m.name, email: m.email, avatar: m.avatar, netBalance: 0, totalPaid: 0, totalShare: 0 };
    }

    for (const e of expenses) {
      const amt = Number(e.amount);
      if (balances[e.paidById]) {
        balances[e.paidById].totalPaid += amt;
      }
      const sps = splitsByExpense[e.id] || [];
      for (const sp of sps) {
        if (balances[sp.userId]) {
          balances[sp.userId].totalShare += sp.amount;
        }
      }
    }

    for (const s of settlements) {
      const amt = Number(s.amount);
      if (balances[s.payerId]) balances[s.payerId].totalPaid += amt;
      if (balances[s.receiverId]) balances[s.receiverId].totalShare += amt;
    }

    for (const uid in balances) {
      balances[uid].netBalance = Math.round((balances[uid].totalPaid - balances[uid].totalShare) * 100) / 100;
    }

    // Debt simplification ("Who owes whom")
    const debts = [];
    const debtors = [];
    const creditors = [];

    for (const uid in balances) {
      const b = balances[uid];
      if (b.netBalance < -0.01) {
        debtors.push({ userId: b.userId, name: b.name, amount: -b.netBalance });
      } else if (b.netBalance > 0.01) {
        creditors.push({ userId: b.userId, name: b.name, amount: b.netBalance });
      }
    }

    // Match debtors to creditors
    let dIdx = 0;
    let cIdx = 0;
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settlementAmount = Math.min(debtor.amount, creditor.amount);

      if (settlementAmount > 0.01) {
        debts.push({
          fromUserId: debtor.userId,
          fromUserName: debtor.name,
          toUserId: creditor.userId,
          toUserName: creditor.name,
          amount: Math.round(settlementAmount * 100) / 100,
        });
      }

      debtor.amount -= settlementAmount;
      creditor.amount -= settlementAmount;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    return {
      ...group,
      currentUserRole: membership.role,
      members,
      expenses: expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
        splits: splitsByExpense[e.id] || [],
      })),
      settlements: settlements.map((s) => ({ ...s, amount: Number(s.amount) })),
      balances: Object.values(balances),
      simplifiedDebts: debts,
    };
  },

  async addGroupMember(groupId, userEmailOrId, currentUserId) {
    const { sqlite } = getDatabase();
    const membership = sqlite.prepare("SELECT role FROM group_memberships WHERE groupId = ? AND userId = ?").get(groupId, currentUserId);
    if (!membership) throw new Error("Unauthorized to add members to this group");

    const targetUser = sqlite.prepare("SELECT * FROM users WHERE LOWER(email) = ? OR id = ?").get(userEmailOrId.trim().toLowerCase(), userEmailOrId);
    if (!targetUser) throw new Error("No user found with the provided email or ID.");

    const existingMem = sqlite.prepare("SELECT id FROM group_memberships WHERE groupId = ? AND userId = ?").get(groupId, targetUser.id);
    if (existingMem) throw new Error("User is already a member of this group.");

    const memId = uuidv4();
    const now = new Date().toISOString();
    sqlite.prepare("INSERT INTO group_memberships (id, groupId, userId, role, joinedAt) VALUES (?, ?, ?, 'MEMBER', ?)").run(memId, groupId, targetUser.id, now);

    // Notify user
    this.createNotification({
      userId: targetUser.id,
      title: "Added to Group",
      message: `You were added to group expenses.`,
      type: "GROUP_EXPENSE",
    });

    return targetUser;
  },

  async createGroupExpense({ groupId, creatorId, paidById, amount, description, categoryId, splits, date, notes }) {
    const { sqlite } = getDatabase();
    const isMember = sqlite.prepare("SELECT role FROM group_memberships WHERE groupId = ? AND userId = ?").get(groupId, creatorId);
    if (!isMember) throw new Error("Unauthorized: You are not a member of this group.");

    const expId = uuidv4();
    const now = new Date().toISOString();
    const expDate = date ? new Date(date).toISOString() : now;

    // Validate splits sum matches amount
    const totalSplitAmount = splits.reduce((acc, s) => acc + Number(s.amount), 0);
    if (Math.abs(totalSplitAmount - Number(amount)) > 0.05) {
      throw new Error(`Split sum (₹${totalSplitAmount.toFixed(2)}) must equal total amount (₹${Number(amount).toFixed(2)}).`);
    }

    const insertExp = sqlite.prepare(`
      INSERT INTO expenses (id, userId, categoryId, groupId, paidById, amount, description, date, paymentMethod, notes, isGroupExpense, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UPI', ?, 1, ?, ?)
    `);

    const insertSplit = sqlite.prepare(`
      INSERT INTO expense_splits (id, expenseId, userId, amount, percentage, isSettled, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `);

    sqlite.transaction(() => {
      insertExp.run(expId, creatorId, categoryId, groupId, paidById, amount, description.trim(), expDate, notes ? notes.trim() : null, now, now);
      for (const s of splits) {
        insertSplit.run(uuidv4(), expId, s.userId, s.amount, s.percentage || null, now);
      }
    })();

    return this.findExpenseById(expId, creatorId);
  },

  async recordSettlement({ groupId, payerId, receiverId, amount, notes, recordedById }) {
    const { sqlite } = getDatabase();
    const isMember = sqlite.prepare("SELECT role FROM group_memberships WHERE groupId = ? AND userId = ?").get(groupId, recordedById);
    if (!isMember) throw new Error("Unauthorized: You are not a member of this group.");

    if (payerId === receiverId) throw new Error("Payer and receiver cannot be the same person.");
    if (Number(amount) <= 0) throw new Error("Settlement amount must be positive.");

    const id = uuidv4();
    const now = new Date().toISOString();

    sqlite.prepare(`
      INSERT INTO settlements (id, groupId, payerId, receiverId, amount, date, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, groupId, payerId, receiverId, amount, now, notes ? notes.trim() : null, now);

    this.createNotification({
      userId: receiverId,
      title: "Settlement Received",
      message: `A settlement payment of ₹${Number(amount).toFixed(2)} was recorded.`,
      type: "SETTLEMENT",
    });

    return { id, groupId, payerId, receiverId, amount: Number(amount), date: now, notes };
  },

  // ---- RECURRING EXPENSES ----
  async getRecurringExpenses(userId) {
    const { sqlite } = getDatabase();
    return sqlite.prepare(`
      SELECT r.*, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor
      FROM recurring_expenses r
      JOIN categories c ON r.categoryId = c.id
      WHERE r.userId = ?
      ORDER BY r.nextDueDate ASC
    `).all(userId).map((r) => ({
      ...r,
      amount: Number(r.amount),
      isActive: Boolean(r.isActive),
    }));
  },

  async createRecurringExpense({ userId, categoryId, amount, description, frequency, startDate, paymentMethod }) {
    const { sqlite } = getDatabase();
    const id = uuidv4();
    const start = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const now = new Date().toISOString();

    // calculate initial nextDueDate
    const nextDue = new Date(start);
    if (frequency === "WEEKLY") nextDue.setDate(nextDue.getDate() + 7);
    else if (frequency === "MONTHLY") nextDue.setMonth(nextDue.getMonth() + 1);
    else if (frequency === "YEARLY") nextDue.setFullYear(nextDue.getFullYear() + 1);

    sqlite.prepare(`
      INSERT INTO recurring_expenses (id, userId, categoryId, amount, description, frequency, startDate, nextDueDate, isActive, paymentMethod, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(id, userId, categoryId, amount, description.trim(), frequency, start, nextDue.toISOString(), paymentMethod || "UPI", now, now);

    return this.getRecurringExpenses(userId);
  },

  async toggleRecurringExpense(id, userId, isActive) {
    const { sqlite } = getDatabase();
    const now = new Date().toISOString();
    sqlite.prepare("UPDATE recurring_expenses SET isActive = ?, updatedAt = ? WHERE id = ? AND userId = ?").run(isActive ? 1 : 0, now, id, userId);
    return true;
  },

  async deleteRecurringExpense(id, userId) {
    const { sqlite } = getDatabase();
    const res = sqlite.prepare("DELETE FROM recurring_expenses WHERE id = ? AND userId = ?").run(id, userId);
    return res.changes > 0;
  },

  // Process scheduled recurring expenses
  async processDueRecurringExpenses(userId) {
    const { sqlite } = getDatabase();
    const now = new Date();
    const nowIso = now.toISOString();

    const dueList = sqlite.prepare(`
      SELECT * FROM recurring_expenses
      WHERE userId = ? AND isActive = 1 AND nextDueDate <= ?
    `).all(userId, nowIso);

    const postedExpenses = [];

    for (const rule of dueList) {
      const expId = uuidv4();
      const insertExp = sqlite.prepare(`
        INSERT INTO expenses (id, userId, categoryId, paidById, amount, description, date, paymentMethod, notes, isGroupExpense, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Recurring auto-post', 0, ?, ?)
      `);

      // Advance nextDueDate
      const nextDue = new Date(rule.nextDueDate);
      if (rule.frequency === "WEEKLY") nextDue.setDate(nextDue.getDate() + 7);
      else if (rule.frequency === "MONTHLY") nextDue.setMonth(nextDue.getMonth() + 1);
      else if (rule.frequency === "YEARLY") nextDue.setFullYear(nextDue.getFullYear() + 1);

      sqlite.transaction(() => {
        insertExp.run(expId, rule.userId, rule.categoryId, rule.userId, rule.amount, rule.description, rule.nextDueDate, rule.paymentMethod, nowIso, nowIso);
        sqlite.prepare("UPDATE recurring_expenses SET lastPostedDate = ?, nextDueDate = ?, updatedAt = ? WHERE id = ?").run(nowIso, nextDue.toISOString(), nowIso, rule.id);
      })();

      postedExpenses.push({ id: expId, description: rule.description, amount: Number(rule.amount) });
    }

    return postedExpenses;
  },

  // ---- NOTIFICATIONS ----
  async getNotifications(userId) {
    const { sqlite } = getDatabase();
    return sqlite.prepare("SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 30").all(userId).map((n) => ({
      ...n,
      isRead: Boolean(n.isRead),
    }));
  },

  async markNotificationRead(id, userId) {
    const { sqlite } = getDatabase();
    sqlite.prepare("UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?").run(id, userId);
    return true;
  },

  async markAllNotificationsRead(userId) {
    const { sqlite } = getDatabase();
    sqlite.prepare("UPDATE notifications SET isRead = 1 WHERE userId = ?").run(userId);
    return true;
  },

  async createNotification({ userId, title, message, type, data = null }) {
    const { sqlite } = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO notifications (id, userId, title, message, type, isRead, data, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, userId, title, message, type, data ? JSON.stringify(data) : null, now);
    return { id, userId, title, message, type, isRead: false, createdAt: now };
  },

  // ---- ANALYTICS & DASHBOARD AGGREGATIONS ----
  async getDashboardSummary(userId) {
    const { sqlite } = getDatabase();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const startOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).toISOString();
    const endOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999)).toISOString();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    // Total spent this month
    const monthSpendRow = sqlite.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as txCount
      FROM expenses
      WHERE userId = ? AND date >= ? AND date <= ?
    `).get(userId, startOfMonth, endOfMonth);
    const monthSpend = Number(monthSpendRow.total);
    const txCount = Number(monthSpendRow.txCount);

    // Today's spending
    const todaySpendRow = sqlite.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE userId = ? AND date >= ? AND date <= ?
    `).get(userId, startOfToday, endOfToday);
    const todaySpend = Number(todaySpendRow.total);

    // Monthly Budget
    const budgetRow = sqlite.prepare(`
      SELECT amount FROM budgets
      WHERE userId = ? AND month = ? AND year = ? AND categoryId IS NULL
    `).get(userId, currentMonth, currentYear);
    const monthlyBudget = budgetRow ? Number(budgetRow.amount) : 0;
    const remainingBudget = monthlyBudget > 0 ? monthlyBudget - monthSpend : 0;

    // Remaining days in month
    const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const todayDate = now.getDate();
    const remainingDays = Math.max(1, totalDaysInMonth - todayDate + 1);

    // Remaining daily allowance calculation:
    // If remaining budget > 0: remaining budget / remaining days
    // If remaining budget <= 0: 0 (budget exceeded or fully consumed)
    const dailyAllowance = remainingBudget > 0 ? Math.round((remainingBudget / remainingDays) * 100) / 100 : 0;

    // Category breakdown this month
    const categoryBreakdown = sqlite.prepare(`
      SELECT c.id, c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) as amount
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.categoryId AND e.userId = ? AND e.date >= ? AND e.date <= ?
      GROUP BY c.id
      HAVING amount > 0
      ORDER BY amount DESC
    `).all(userId, startOfMonth, endOfMonth).map((c) => ({
      ...c,
      amount: Number(c.amount),
    }));

    // Last 7 days spending trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
      const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;

      const sumRow = sqlite.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE userId = ? AND date >= ? AND date <= ?
      `).get(userId, dayStart, dayEnd);

      last7Days.push({
        day: dayName,
        date: dayLabel,
        amount: Number(sumRow.total),
      });
    }

    // Recent 5 transactions
    const recent = sqlite.prepare(`
      SELECT e.*, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor
      FROM expenses e
      JOIN categories c ON e.categoryId = c.id
      WHERE e.userId = ?
      ORDER BY e.date DESC
      LIMIT 5
    `).all(userId).map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      description: r.description,
      date: r.date,
      paymentMethod: r.paymentMethod,
      category: { id: r.categoryId, name: r.categoryName, icon: r.categoryIcon, color: r.categoryColor },
    }));

    // Outstanding settlements (You Owe / You are Owed) across all user groups
    const userGroups = sqlite.prepare("SELECT groupId FROM group_memberships WHERE userId = ?").all(userId);
    let netGroupBalance = 0;
    for (const g of userGroups) {
      const gDetails = await this.getGroupById(g.groupId, userId);
      if (gDetails && gDetails.balances) {
        const myBal = gDetails.balances.find((b) => b.userId === userId);
        if (myBal) netGroupBalance += myBal.netBalance;
      }
    }

    return {
      monthSpend,
      txCount,
      todaySpend,
      monthlyBudget,
      remainingBudget,
      remainingDays,
      totalDaysInMonth,
      dailyAllowance,
      dailyAllowanceExplanation: monthlyBudget > 0
        ? remainingBudget > 0
          ? `Calculated as ₹${remainingBudget.toFixed(2)} remaining budget ÷ ${remainingDays} days left in ${now.toLocaleString("en-IN", { month: "long" })}.`
          : `Monthly budget of ₹${monthlyBudget.toFixed(2)} has been fully utilized or exceeded.`
        : `Set a monthly budget to calculate your dynamic daily allowance.`,
      categoryBreakdown,
      last7Days,
      recentExpenses: recent,
      netGroupBalance: Math.round(netGroupBalance * 100) / 100,
    };
  },

  async getAnalytics({ userId, year }) {
    const { sqlite } = getDatabase();
    const y = Number(year) || new Date().getFullYear();

    // 12 months trend for the year
    const monthlyTrends = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let m = 0; m < 12; m++) {
      const start = new Date(Date.UTC(y, m, 1)).toISOString();
      const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)).toISOString();

      const spendRow = sqlite.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE userId = ? AND date >= ? AND date <= ?
      `).get(userId, start, end);

      const bRow = sqlite.prepare(`
        SELECT amount FROM budgets
        WHERE userId = ? AND month = ? AND year = ? AND categoryId IS NULL
      `).get(userId, m + 1, y);

      monthlyTrends.push({
        month: monthNames[m],
        monthIndex: m + 1,
        spent: Number(spendRow.total),
        budget: bRow ? Number(bRow.amount) : 0,
      });
    }

    // Category distribution for the year
    const yearStart = new Date(Date.UTC(y, 0, 1)).toISOString();
    const yearEnd = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999)).toISOString();

    const categoryDistribution = sqlite.prepare(`
      SELECT c.id, c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) as total
      FROM categories c
      JOIN expenses e ON c.id = e.categoryId
      WHERE e.userId = ? AND e.date >= ? AND e.date <= ?
      GROUP BY c.id
      ORDER BY total DESC
    `).all(userId, yearStart, yearEnd).map((c) => ({
      ...c,
      total: Number(c.total),
    }));

    const totalYearSpend = monthlyTrends.reduce((acc, m) => acc + m.spent, 0);

    return {
      year: y,
      totalYearSpend,
      monthlyTrends,
      categoryDistribution,
    };
  },
};

module.exports = dbService;
