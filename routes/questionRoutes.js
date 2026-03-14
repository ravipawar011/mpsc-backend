const express = require("express");
const router = express.Router();

const {
  createQuestion,
  getQuestionsByTest,
  updateQuestion,
  deleteQuestion,
  // Assuming these exist or will be created in questionController.js
  getAppQuestions,   // public/app version (hides correct answers)
  submitTest         // submit answers & calculate result
} = require("../controllers/questionController");

const authMiddleware  = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// ────────────────────────────────────────────────
// APP / STUDENT ROUTES (authenticated users)
// ────────────────────────────────────────────────

/**
 * Get questions for a test (for students/app)
 * - Hides correct_option
 * - Usually called after starting an attempt
 */
router.get("/tests/:testId/questions",authMiddleware, getAppQuestions);

/**
 * Submit answers for a test attempt
 * - Can accept bulk answers or single answer
 * - Calculates score, saves attempt_answers, updates test_attempts
 */
router.post("/tests/submit",authMiddleware,submitTest);

// ────────────────────────────────────────────────
// ADMIN / MANAGEMENT ROUTES (teachers/admins only)
// ────────────────────────────────────────────────

router.post   ("/",               authMiddleware, adminMiddleware, createQuestion);   // Create new question
router.get    ("/test/:testId",   authMiddleware, adminMiddleware, getQuestionsByTest); // Get all questions of a test (with correct answers)
router.put    ("/:id",            authMiddleware, adminMiddleware, updateQuestion);     // Update question
router.delete ("/:id",            authMiddleware, adminMiddleware, deleteQuestion);     // Delete question

// Optional: better RESTful alternative for submit (recommended)
// router.post("/attempts/:attemptId/submit", authMiddleware, submitTest);

module.exports = router;