require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes        = require("./routes/authRoutes");
const testRoutes        = require("./routes/testRoutes");
const questionRoutes    = require("./routes/questionRoutes");
const rewardRoutes      = require("./routes/rewardRoutes");
const paymentRoutes     = require("./routes/paymentRoutes");
const testAttemptRoutes = require("./routes/testAttemptRoutes");
const userRoutes        = require("./routes/userRoutes");
const dashboardRoutes   = require("./routes/dashboardRoutes");
const attemptRoutes     = require("./routes/attemptRoutes");

// Mount routes
app.use("/api/auth",          authRoutes);
app.use("/api/tests",         testRoutes);
app.use("/api/questions",     questionRoutes);
app.use("/api/rewards",       rewardRoutes);
app.use("/api/payments",      paymentRoutes);
app.use("/api/test-attempts", testAttemptRoutes);
app.use("/api/users",         userRoutes);          // changed from /api → /api/users
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/attempts",      attemptRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("MPSC API Server is running");
});

// 404 handler (optional but recommended)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});