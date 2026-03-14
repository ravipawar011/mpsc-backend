const db = require("../config/db");

// Helper to safely parse integers with fallback
const parseIntSafe = (value, fallback = 1) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

// GET ALL USERS (admin only)
exports.getUsers = (req, res) => {
  let { page = 1, limit = 15, search = "" } = req.query;

  page = parseIntSafe(page, 1);
  limit = parseIntSafe(limit, 15);
  const offset = (page - 1) * limit;

  const searchQuery = `%${search.trim()}%`;

  const countSql = `
    SELECT COUNT(*) as total
    FROM users
    WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
  `;

  const sql = `
    SELECT id, name, email, phone, role
    FROM users
    WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  db.query(countSql, [searchQuery, searchQuery, searchQuery], (err, countResult) => {
    if (err) {
      console.error("Count query error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    const totalUsers = countResult[0].total;

    db.query(sql, [searchQuery, searchQuery, searchQuery, limit, offset], (err, result) => {
      if (err) {
        console.error("Users query error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        users: result,
      });
    });
  });
};

// GET SINGLE USER BY ID (admin only)
exports.getUserById = (req, res) => {
  const userId = req.params.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const sql = "SELECT id, name, email, phone, role FROM users WHERE id = ?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Get user error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result[0]);
  });
};

// UPDATE USER (admin only)
exports.updateUser = (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, role } = req.body;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  // Optional: basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const sql = `
    UPDATE users 
    SET name = ?, email = ?, phone = ?, role = ?
    WHERE id = ?
  `;

  db.query(sql, [name.trim(), email.trim(), phone?.trim() || null, role || "user", userId], (err, result) => {
    if (err) {
      console.error("Update user error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  });
};

// DELETE USER (admin only) + cleanup related data
exports.deleteUser = (req, res) => {
  const userId = req.params.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction begin error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // 1. Delete test attempts
    db.query("DELETE FROM test_attempts WHERE user_id = ?", [userId], (err) => {
      if (err) {
        return db.rollback(() => {
          console.error("Delete attempts error:", err);
          res.status(500).json({ message: "Error deleting test attempts" });
        });
      }

      // 2. Delete user
      db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) {
          return db.rollback(() => {
            console.error("Delete user error:", err);
            res.status(500).json({ message: "Error deleting user" });
          });
        }

        if (result.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ message: "User not found" });
          });
        }

        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Commit error:", err);
              res.status(500).json({ message: "Database commit error" });
            });
          }

          res.json({ message: "User and related data deleted successfully" });
        });
      });
    });
  });
};

// GET OWN PROFILE (for logged-in user - any role)
exports.getProfile = (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "User ID not found in request" });
  }

  const sql = "SELECT id, name, email, phone, role FROM users WHERE id = ?";

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Get profile error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(result[0]);
  });
};


// ─── Allow authenticated user to update their own profile ───
exports.updateOwnProfile = async (req, res) => {
  try {
    const userId = req.userId; // from authMiddleware
    const { name, phone } = req.body; // only allow safe fields

    if (!name && !phone) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    const sql = "UPDATE users SET ? WHERE id = ?";
    db.query(sql, [updates, userId], (err, result) => {
      if (err) return res.status(500).json({ message: "Update failed" });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Profile updated successfully" });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};