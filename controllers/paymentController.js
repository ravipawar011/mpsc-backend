const db = require("../config/db");


// CREATE PAYMENT
exports.createPayment = (req, res) => {

  const { user_id, test_id, amount, payment_status, payment_id } = req.body;

  const sql = `
    INSERT INTO payments (user_id, test_id, amount, payment_status, payment_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, test_id, amount, payment_status, payment_id], (err, result) => {

    if (err) return res.status(500).json(err);

    res.json({
      message: "Payment recorded successfully",
      paymentId: result.insertId
    });

  });

};



// GET ALL PAYMENTS (ADMIN)
exports.getPayments = (req, res) => {

  const sql = `
    SELECT p.*, u.name, t.title
    FROM payments p
    JOIN users u ON p.user_id = u.id
    JOIN tests t ON p.test_id = t.id
  `;

  db.query(sql, (err, result) => {

    if (err) return res.status(500).json(err);

    res.json(result);

  });

};



// GET USER PAYMENTS
exports.getUserPayments = (req, res) => {

  const { userId } = req.params;

  const sql = `
    SELECT p.*, t.title
    FROM payments p
    JOIN tests t ON p.test_id = t.id
    WHERE p.user_id = ?
  `;

  db.query(sql, [userId], (err, result) => {

    if (err) return res.status(500).json(err);

    res.json(result);

  });

};



// VERIFY PAYMENT ACCESS (check if user purchased test)
exports.checkTestAccess = (req, res) => {

  const { user_id, test_id } = req.body;

  const sql = `
    SELECT * FROM payments 
    WHERE user_id = ? AND test_id = ? AND payment_status = 'success'
  `;

  db.query(sql, [user_id, test_id], (err, result) => {

    if (err) return res.status(500).json(err);

    if (result.length > 0) {
      return res.json({ access: true });
    }

    res.json({ access: false });

  });

};