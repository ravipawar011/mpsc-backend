const db = require("../config/db");

// CREATE QUESTION
exports.createQuestion = (req, res) => {
  const {
    test_id,
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
  } = req.body;

  const sql = `
    INSERT INTO questions
    (test_id, question, option_a, option_b, option_c, option_d, correct_option)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [test_id, question, option_a, option_b, option_c, option_d, correct_option],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Question added successfully",
        questionId: result.insertId,
      });
    },
  );
};

// GET QUESTIONS BY TEST
exports.getQuestionsByTest = (req, res) => {
  const { testId } = req.params;

  const sql = "SELECT * FROM questions WHERE test_id = ?";

  db.query(sql, [testId], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
};

// UPDATE QUESTION
exports.updateQuestion = (req, res) => {
  const { id } = req.params;

  const { question, option_a, option_b, option_c, option_d, correct_option } =
    req.body;

  const sql = `
    UPDATE questions 
    SET question=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_option=?
    WHERE id=?
  `;

  db.query(
    sql,
    [question, option_a, option_b, option_c, option_d, correct_option, id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({ message: "Question updated successfully" });
    },
  );
};

// DELETE QUESTION
exports.deleteQuestion = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM questions WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({ message: "Question deleted successfully" });
  });
};

exports.getAppQuestions = (req, res) => {
  const { testId } = req.params;
  const sql = `
  SELECT 
  id,
  question,
  option_a,
  option_b,
  option_c,
  option_d
  FROM questions
  WHERE test_id = ?
  `;

  db.query(sql, [testId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json({
      total: result.length,
      questions: result,
    });
  });
};

// ✅ FIXED & SAFE submitTest
exports.submitTest = (req, res) => {

  const userId = req.userId;
  const { test_id, answers } = req.body;

  // TEST ID REQUIRED
  if (!test_id) {
    return res.status(400).json({
      message: "Test ID is required"
    });
  }

  // ANSWERS REQUIRED
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({
      message: "Answers are required"
    });
  }

  // CHECK TEST EXISTS
  const checkTestSql = `
  SELECT id FROM tests WHERE id = ?
  `;

  db.query(checkTestSql, [test_id], (err, testResult) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Database error"
      });
    }

    if (!testResult || testResult.length === 0) {
      return res.status(404).json({
        message: "Test not found"
      });
    }

    // CREATE TEST ATTEMPT
    const attemptSql = `
    INSERT INTO test_attempts (user_id, test_id)
    VALUES (?, ?)
    `;

    db.query(attemptSql, [userId, test_id], (err, attemptResult) => {

      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Database error"
        });
      }

      const attemptId = attemptResult.insertId;
      let score = 0;

      const promises = answers.map((ans) => {

        return new Promise((resolve, reject) => {

          // VALIDATE ANSWER FORMAT
          if (!ans.question_id || !ans.selected_option) {
            return reject({
              message: "Invalid answer format"
            });
          }

          const checkQuestionSql = `
          SELECT correct_option
          FROM questions
          WHERE id = ? AND test_id = ?
          `;

          db.query(checkQuestionSql, [ans.question_id, test_id], (err, qResult) => {

            if (err) {
              return reject({
                message: "Database error"
              });
            }

            // QUESTION NOT FOUND
            if (!qResult || qResult.length === 0) {
              return reject({
                message: `Question not found: ${ans.question_id}`
              });
            }

            const correct = qResult[0].correct_option;
            const isCorrect = correct === ans.selected_option;

            if (isCorrect) score++;

            const insertAnswerSql = `
            INSERT INTO answers
            (attempt_id, question_id, selected_option, is_correct)
            VALUES (?, ?, ?, ?)
            `;

            db.query(
              insertAnswerSql,
              [attemptId, ans.question_id, ans.selected_option, isCorrect],
              (err) => {

                if (err) {
                  return reject({
                    message: "Failed to save answer"
                  });
                }

                resolve();

              }
            );

          });

        });

      });

      Promise.all(promises)
        .then(() => {

          const updateScoreSql = `
          UPDATE test_attempts
          SET score = ?
          WHERE id = ?
          `;

          db.query(updateScoreSql, [score, attemptId], (err) => {

            if (err) {
              return res.status(500).json({
                message: "Failed to update score"
              });
            }

            res.json({
              message: "Test submitted successfully",
              score
            });

          });

        })
        .catch((error) => {

          return res.status(400).json({
            message: error.message || "Error submitting test"
          });

        });

    });

  });

};
