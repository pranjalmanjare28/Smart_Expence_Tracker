const express = require("express");
const {
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
} = require("../controllers/groupController");
const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.get("/", getGroups);
router.post("/", validate(createGroupSchema), createGroup);
router.get("/:id", getGroupDetails);
router.post("/:id/members", validate(addMemberSchema), addMember);
router.post("/:id/expenses", validate(createGroupExpenseSchema), createGroupExpense);
router.post("/:id/settlements", validate(settlementSchema), recordSettlement);

module.exports = router;
