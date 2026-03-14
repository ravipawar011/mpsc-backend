const adminMiddleware = (req, res, next) => {

  if (req.userRole !== "admin") {
    return res.status(403).json({
      message: "Admin access only"
    });
  }

  next();

};

module.exports = adminMiddleware;