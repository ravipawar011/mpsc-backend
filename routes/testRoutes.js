const express = require("express");
const router = express.Router();

const {
  createTest,
  getTests,        // admin: all tests
  getTestById,
  updateTest,
  deleteTest,
  getAppTests      // public: active/available tests
} = require("../controllers/testController");

const authMiddleware  = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
// ────────────────────────────────────────────────
// PUBLIC / STUDENT APP ROUTES (authenticated users)
// ────────────────────────────────────────────────

router.get    ("/active",         authMiddleware, getAppTests);                     // Get currently active tests for app/students
// ────────────────────────────────────────────────
// ADMIN / MANAGEMENT ROUTES (requires admin rights)
// ────────────────────────────────────────────────

router.post   ("/",               authMiddleware, adminMiddleware, createTest);     // Create test
router.get    ("/",               authMiddleware, adminMiddleware, getTests);       // List all tests (admin)
router.get    ("/:id",            authMiddleware, adminMiddleware, getTestById);    // Get one test (admin)
router.put    ("/:id",            authMiddleware, adminMiddleware, updateTest);     // Update test
router.delete ("/:id",            authMiddleware, adminMiddleware, deleteTest);     // Delete test



// Optional: Allow students to view basic details of a specific test
// (you can add more restrictions in the controller if needed)
router.get    ("/:id/preview",    authMiddleware, getTestById);

module.exports = router;