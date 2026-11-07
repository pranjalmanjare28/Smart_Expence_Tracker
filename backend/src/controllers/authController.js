const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const dbService = require("../services/dbService");

const JWT_SECRET = process.env.JWT_SECRET || "smart-expenses-tracker-jwt-secret-2026";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Schemas
const signupSchema = {
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(70),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
    passwordConfirmation: z.string().optional(),
  }).refine((data) => !data.passwordConfirmation || data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
};

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2).max(70).optional(),
    currency: z.string().max(10).optional(),
    dateFormat: z.string().max(20).optional(),
  }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  }),
};

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await dbService.findUserByEmail(email);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await dbService.createUser({
      name,
      email,
      password: hashedPassword,
      avatar: name.trim()[0].toUpperCase(),
    });

    const token = generateToken(user);
    res.cookie("token", token, COOKIE_OPTIONS);

    // Create welcome notification
    await dbService.createNotification({
      userId: user.id,
      title: "Welcome to Smart Expenses Tracker!",
      message: "Your financial tracker is ready. Set your monthly budget and log your first expense.",
      type: "SYSTEM",
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const userWithPassword = await dbService.findUserByEmail(email);

    if (!userWithPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isValid = await bcrypt.compare(password, userWithPassword.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = await dbService.findUserById(userWithPassword.id);
    const token = generateToken(user);
    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      success: true,
      message: "Logged in successfully.",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res) {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({
    success: true,
    message: "Logged out successfully.",
  });
}

async function me(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}

async function updateProfile(req, res, next) {
  try {
    const updated = await dbService.updateUser(req.user.id, req.body);
    res.json({
      success: true,
      message: "Profile updated successfully.",
      user: updated,
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userWithPassword = await dbService.findUserByEmail(req.user.email);

    const isValid = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await dbService.updateUser(req.user.id, { password: hashedPassword });

    res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const { confirmation } = req.body;
    if (confirmation !== "DELETE MY ACCOUNT") {
      return res.status(400).json({
        success: false,
        message: "Please enter the exact confirmation phrase 'DELETE MY ACCOUNT' to delete your account.",
      });
    }

    await dbService.deleteUser(req.user.id);
    res.clearCookie("token", COOKIE_OPTIONS);

    res.json({
      success: true,
      message: "Account and associated data deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
