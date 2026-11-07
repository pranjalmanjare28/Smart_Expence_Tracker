const jwt = require("jsonwebtoken");
const dbService = require("../services/dbService");

const JWT_SECRET = process.env.JWT_SECRET || "smart-expenses-tracker-jwt-secret-2026";

async function protect(req, res, next) {
  try {
    let token = null;

    // Check HttpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await dbService.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session is invalid or user no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please log in again.",
    });
  }
}

module.exports = protect;
