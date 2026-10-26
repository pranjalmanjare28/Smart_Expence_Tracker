const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  signup,
  login,
  logout,
  me,
  updateProfile,
  changePassword,
  deleteAccount,
  signupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

// Sensitive endpoint rate limiting: max 15 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", protect, logout);
router.get("/me", protect, me);
router.put("/profile", protect, validate(updateProfileSchema), updateProfile);
router.put("/change-password", protect, validate(changePasswordSchema), changePassword);
router.delete("/account", protect, deleteAccount);

module.exports = router;
