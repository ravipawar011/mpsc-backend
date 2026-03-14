const express = require("express");
const router = express.Router();

const {
  submitTest,
  getAllAttempts,
  getUserAttempts,
  getLeaderboard
} = require("../controllers/testAttemptController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");


// USER SUBMIT TEST
router.post("/submit", authMiddleware, submitTest);


// USER ATTEMPTS
router.get("/user/:userId", authMiddleware, getUserAttempts);


// LEADERBOARD
router.get("/leaderboard/:testId", authMiddleware, getLeaderboard);


// ADMIN VIEW ALL ATTEMPTS
router.get("/", authMiddleware, adminMiddleware, getAllAttempts);


module.exports = router;