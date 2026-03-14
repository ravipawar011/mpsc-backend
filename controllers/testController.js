const db = require("../config/db");

exports.createTest = (req, res) => {
  const {
    title,
    description,
    total_questions,
    duration,
    price,
    is_free,
    status,
    start_date,
    end_date,
  } = req.body;

  if (!title || !duration || !total_questions) {
    return res.status(400).json({
      message: "Title, duration and total_questions required",
    });
  }

  const sql = `
    INSERT INTO tests
    (title, description, total_questions, duration, price, is_free, status, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      title,
      description || "",
      total_questions,
      duration,
      price || 0,
      is_free || false,
      status || "active",
      start_date || null,
      end_date || null,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Database error",
        });
      }

      res.status(201).json({
        message: "Test created successfully",
        testId: result.insertId,
      });
    },
  );
};

exports.getTests = (req, res) => {
  const sql = "SELECT * FROM tests ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json({
      total: result.length,
      tests: result,
    });
  });
};

exports.getTestById = (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM tests WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    res.json(result[0]);
  });
};

exports.updateTest = (req, res) => {
  const { id } = req.params;

  const {
    title,
    description,
    total_questions,
    duration,
    price,
    is_free,
    status,
    start_date,
    end_date,
  } = req.body;

  const sql = `
    UPDATE tests
    SET 
      title = ?,
      description = ?,
      total_questions = ?,
      duration = ?,
      price = ?,
      is_free = ?,
      status = ?,
      start_date = ?,
      end_date = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      title,
      description,
      total_questions,
      duration,
      price,
      is_free,
      status,
      start_date,
      end_date,
      id,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Database error",
        });
      }

      res.json({
        message: "Test updated successfully",
      });
    },
  );
};

exports.deleteTest = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM tests WHERE id=?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json({
      message: "Test deleted successfully",
    });
  });
};

exports.getAppTests = (req, res) => {
  const sql = `
    SELECT 
      id,
      title,
      description,
      total_questions,
      duration,
      price,
      is_free,
      start_date,
      end_date
    FROM tests
    WHERE status = 'active'
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json({
      total: result.length,
      tests: result,
    });
  });
};
