const db = require("../config/db");

exports.getDashboardStats = (req, res) => {

  const stats = {};

  const usersSql = "SELECT COUNT(*) as totalUsers FROM users";
  const testsSql = "SELECT COUNT(*) as totalTests FROM tests";

  db.query(usersSql, (err, usersResult) => {

    if (err) return res.status(500).json(err);

    stats.totalUsers = usersResult[0].totalUsers;

    db.query(testsSql, (err, testsResult) => {

      if (err) return res.status(500).json(err);

      stats.totalTests = testsResult[0].totalTests;

      res.json(stats);

    });

  });

};