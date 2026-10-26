const { z } = require("zod");
const dbService = require("../services/dbService");

const createGroupSchema = {
  body: z.object({
    name: z.string().min(2, "Group name must be at least 2 characters").max(80),
    description: z.string().max(250).optional(),
  }),
};

const addMemberSchema = {
  body: z.object({
    emailOrId: z.string().min(1, "Email or user ID is required"),
  }),
};

const createGroupExpenseSchema = {
  body: z.object({
    amount: z.number().positive("Amount must be greater than 0"),
    description: z.string().min(1, "Description is required").max(120),
    categoryId: z.string().min(1, "Category is required"),
    paidById: z.string().min(1, "Payer user ID is required"),
    date: z.string().optional(),
    notes: z.string().max(500).optional(),
    splits: z.array(
      z.object({
        userId: z.string(),
        amount: z.number().nonnegative(),
        percentage: z.number().optional(),
      })
    ).min(1, "At least one split participant is required"),
  }),
};

const settlementSchema = {
  body: z.object({
    payerId: z.string().min(1, "Payer ID is required"),
    receiverId: z.string().min(1, "Receiver ID is required"),
    amount: z.number().positive("Settlement amount must be greater than 0"),
    notes: z.string().max(250).optional(),
  }),
};

async function getGroups(req, res, next) {
  try {
    const groups = await dbService.getGroups(req.user.id);
    res.json({ success: true, groups });
  } catch (error) {
    next(error);
  }
}

async function createGroup(req, res, next) {
  try {
    const { name, description } = req.body;
    const group = await dbService.createGroup({
      name,
      description,
      userId: req.user.id,
    });
    res.status(201).json({
      success: true,
      message: "Group created successfully.",
      group,
    });
  } catch (error) {
    next(error);
  }
}

async function getGroupDetails(req, res, next) {
  try {
    const group = await dbService.getGroupById(req.params.id, req.user.id);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found or you are not a member." });
    }
    res.json({ success: true, group });
  } catch (error) {
    next(error);
  }
}

async function addMember(req, res, next) {
  try {
    const { emailOrId } = req.body;
    const member = await dbService.addGroupMember(req.params.id, emailOrId, req.user.id);
    res.json({
      success: true,
      message: `Member ${member.name} added successfully to the group.`,
      member,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function createGroupExpense(req, res, next) {
  try {
    const { amount, description, categoryId, paidById, date, notes, splits } = req.body;

    const expense = await dbService.createGroupExpense({
      groupId: req.params.id,
      creatorId: req.user.id,
      paidById,
      amount,
      description,
      categoryId,
      splits,
      date,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Shared expense added successfully.",
      expense,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function recordSettlement(req, res, next) {
  try {
    const { payerId, receiverId, amount, notes } = req.body;

    const settlement = await dbService.recordSettlement({
      groupId: req.params.id,
      payerId,
      receiverId,
      amount,
      notes,
      recordedById: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Settlement recorded successfully.",
      settlement,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  getGroups,
  createGroup,
  getGroupDetails,
  addMember,
  createGroupExpense,
  recordSettlement,
  createGroupSchema,
  addMemberSchema,
  createGroupExpenseSchema,
  settlementSchema,
};
