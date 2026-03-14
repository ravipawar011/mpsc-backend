const express = require("express");
const router = express.Router();

const {
  createPayment,
  getPayments,
  getUserPayments,
  checkTestAccess
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");


// USER PAYMENT
router.post("/create", authMiddleware, createPayment);


// ADMIN VIEW PAYMENTS
router.get("/", authMiddleware, adminMiddleware, getPayments);


// USER PAYMENT HISTORY
router.get("/user/:userId", authMiddleware, getUserPayments);


// CHECK TEST ACCESS
router.post("/check-access", authMiddleware, checkTestAccess);


module.exports = router;