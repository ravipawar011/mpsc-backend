const db = require("../config/db");

// SUBMIT TEST RESULT
exports.submitTest = (req, res) => {

  const userId = req.userId;
  const { test_id, answers } = req.body;

  if (!answers || answers.length === 0) {
    return res.status(400).json({
      message: "Answers required"
    });
  }

  // create attempt
  const attemptSql = `
  INSERT INTO test_attempts (user_id, test_id)
  VALUES (?, ?)
  `;

  db.query(attemptSql, [userId, test_id], (err, result) => {

    if (err) {

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          message: "Test already submitted"
        });
      }

      return res.status(500).json({
        message: "Database error"
      });
    }

    const attemptId = result.insertId;
    let score = 0;

    const promises = answers.map(ans => {

      return new Promise((resolve, reject) => {

        const sql = `
        SELECT correct_option
        FROM questions
        WHERE id = ?
        `;

        db.query(sql, [ans.question_id], (err, q) => {

          if (err) return reject(err);

          const correct = q[0].correct_option;
          const isCorrect = correct === ans.selected_option;

          if (isCorrect) score++;

          const insertAnswer = `
          INSERT INTO answers
          (attempt_id, question_id, selected_option, is_correct)
          VALUES (?, ?, ?, ?)
          `;

          db.query(insertAnswer, [
            attemptId,
            ans.question_id,
            ans.selected_option,
            isCorrect
          ], () => resolve());

        });

      });

    });

    Promise.all(promises).then(() => {

      db.query(
        "UPDATE test_attempts SET score=? WHERE id=?",
        [score, attemptId]
      );

      res.json({
        message: "Test submitted",
        score
      });

    });

  });

};


// GET ALL ATTEMPTS (ADMIN)
exports.getAllAttempts = (req, res) => {

  const sql = `
    SELECT ta.*, u.name, t.title
    FROM test_attempts ta
    JOIN users u ON ta.user_id = u.id
    JOIN tests t ON ta.test_id = t.id
  `;

  db.query(sql, (err, result) => {

    if (err) return res.status(500).json(err);

    res.json(result);

  });

};



// GET USER ATTEMPTS
exports.getUserAttempts = (req, res) => {

  const { userId } = req.params;

  const sql = `
    SELECT ta.*, t.title
    FROM test_attempts ta
    JOIN tests t ON ta.test_id = t.id
    WHERE ta.user_id = ?
  `;

  db.query(sql, [userId], (err, result) => {

    if (err) return res.status(500).json(err);

    res.json(result);

  });

};



// GET LEADERBOARD
exports.getLeaderboard = (req, res) => {

  const { testId } = req.params;

  const sql = `
    SELECT ta.*, u.name
    FROM test_attempts ta
    JOIN users u ON ta.user_id = u.id
    WHERE ta.test_id = ?
    ORDER BY ta.score DESC, ta.time_taken ASC
    LIMIT 10
  `;

  db.query(sql, [testId], (err, result) => {

    if (err) return res.status(500).json(err);

    res.json(result);

  });

};