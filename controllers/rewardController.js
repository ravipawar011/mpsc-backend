const db = require("../config/db");


// CREATE REWARD (Admin will give reward)
exports.createReward = (req, res) => {

  const { user_id, test_id, rank, reward_amount } = req.body;

  const sql = `
    INSERT INTO rewards (user_id, test_id, rank, reward_amount)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [user_id, test_id, rank, reward_amount], (err, result) => {

    if (err) return res.status(500).json(err);

    res.json({
      message: "Reward assigned successfully",
      rewardId: result.insertId
    });

  });

};



// GET ALL REWARDS
exports.getRewards = (req, res) => {

  const sql = `
    SELECT r.*, u.name, t.title
    FROM rewards r
    JOIN users u ON r.user_id = u.id
    JOIN tests t ON r.test_id = t.id
  `;

  db.query(sql, (err, result) => {

    if (err) return res.status(500).json(err);

    res.json(result);

  });

};



// GET REWARDS BY USER
exports.getUserRewards = (req, res) => {

  const { userId } = req.params;

  const sql = `
    SELECT r.*, t.title
    FROM rewards r
    JOIN tests t ON r.test_id = t.id
    WHERE r.user_id = ?
  `;

  db.query(sql, [userId], (err, result) => {

    if (err) return res.status(500).json(err);

    res.json(result);

  });

};



// DELETE REWARD
exports.deleteReward = (req, res) => {

  const { id } = req.params;

  const sql = `DELETE FROM rewards WHERE id = ?`;

  db.query(sql, [id], (err, result) => {

    if (err) return res.status(500).json(err);

    res.json({
      message: "Reward deleted successfully"
    });

  });

};