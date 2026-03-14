const express = require("express");
const router = express.Router();

const {
  createReward,
  getRewards,
  getUserRewards,
  deleteReward
} = require("../controllers/rewardController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");


// ADMIN ONLY
router.post("/create", authMiddleware, adminMiddleware, createReward);
router.delete("/delete/:id", authMiddleware, adminMiddleware, deleteReward);


// USER
router.get("/", authMiddleware, getRewards);
router.get("/user/:userId", authMiddleware, getUserRewards);


module.exports = router;