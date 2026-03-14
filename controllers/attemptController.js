const db = require("../config/db");

// GET ALL TEST ATTEMPTS (ADMIN)
exports.getAllAttempts = (req, res) => {

  const sql = `
  SELECT 
  ta.id,
  u.name AS user_name,
  t.title AS test_title,
  ta.score,
  ta.created_at
  FROM test_attempts ta
  JOIN users u ON ta.user_id = u.id
  JOIN tests t ON ta.test_id = t.id
  ORDER BY ta.id DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {
      return res.status(500).json({
        message: "Database error"
      });
    }

    res.json({
      attempts: result
    });

  });

};

exports.getAttemptDetails = (req, res) => {

  const { attemptId } = req.params;

  const sql = `
  SELECT 
  q.question,
  q.correct_option,
  a.selected_option,
  a.is_correct
  FROM answers a
  JOIN questions q ON a.question_id = q.id
  WHERE a.attempt_id = ?
  `;

  db.query(sql, [attemptId], (err, result) => {

    if (err) {
      return res.status(500).json({
        message: "Database error"
      });
    }

    res.json(result);

  });

};


// /api/attempts/user/:userId
exports.getUserAttempts = (req, res) => {

  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  const sql = `
    SELECT 
      ta.id AS attempt_id,
      ta.test_id,
      t.title AS test_title,
      ta.user_id,
      u.name AS user_name,
      u.email AS user_email,
      ta.score,
      ta.created_at
    FROM 
      test_attempts ta
    INNER JOIN 
      tests t ON ta.test_id = t.id
    INNER JOIN 
      users u ON ta.user_id = u.id
    WHERE 
      ta.user_id = ?
    ORDER BY 
      ta.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {

    if (err) {
      console.error("Error fetching user attempts:", err);

      return res.status(500).json({
        message: "Database error while fetching attempts",
      });
    }

    if (!results || results.length === 0) {
      return res.status(200).json({
        message: "No attempts found for this user",
        attempts: [],
        count: 0,
      });
    }

    res.status(200).json({
      message: "User attempts retrieved successfully",
      attempts: results,
      count: results.length,
    });

  });

};