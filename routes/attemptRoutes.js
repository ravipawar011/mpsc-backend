const express = require("express");
const router = express.Router();

// Controllers
const {
  getAllAttempts,
  getAttemptDetails,
  getUserAttempts
} = require("../controllers/attemptController");

// Middlewares
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");


// ────────────────────────────────────────────────
// ADMIN ROUTES
// ────────────────────────────────────────────────

// Get attempts for a specific user
router.get("/user/:userId", authMiddleware, adminMiddleware, getUserAttempts);

// Get all attempts
router.get("/", authMiddleware, adminMiddleware, getAllAttempts);

// Get attempt details
router.get("/:attemptId", authMiddleware, adminMiddleware, getAttemptDetails);

module.exports = router;