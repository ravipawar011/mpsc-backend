  const express = require("express");
  const router = express.Router();

  const {
    getUsers,         // admin: list all users
    getUserById,
    updateUser,
    deleteUser,
    getProfile,
    updateOwnProfile        // authenticated user: get own profile
  } = require("../controllers/userController");

  const authMiddleware  = require("../middleware/authMiddleware");
  const adminMiddleware = require("../middleware/adminMiddleware");

  // ────────────────────────────────────────────────
  // USER / PROFILE ROUTES (authenticated user only)
  // ────────────────────────────────────────────────
  router.get   ("/profile",        authMiddleware, getProfile);                       // Get current user's own profile
  router.put("/profile",           authMiddleware, updateOwnProfile);
  // ────────────────────────────────────────────────
  // ADMIN / MANAGEMENT ROUTES (requires admin rights)
  // ────────────────────────────────────────────────

  router.get   ("/",               authMiddleware, adminMiddleware, getUsers);        // List all users
  router.get   ("/:id",            authMiddleware, adminMiddleware, getUserById);     // Get one user by ID
  router.put   ("/:id",            authMiddleware, adminMiddleware, updateUser);      // Update user
  router.delete("/:id",            authMiddleware, adminMiddleware, deleteUser);      // Delete user



  // Optional: Allow users to update their own profile (common pattern)
  // You can add this later if needed:
  // router.put("/profile", authMiddleware, userController.updateOwnProfile);

  module.exports = router;