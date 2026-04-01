const jwt = require("jsonwebtoken");
const MyConstants = require("./MyConstants");

const JwtUtil = {
  genToken(username, password) {
    return jwt.sign(
      { username, password },
      MyConstants.JWT_SECRET,
      { expiresIn: MyConstants.JWT_EXPIRES },
    );
  },

  checkToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const raw =
      req.headers["x-access-token"] ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader);

    if (!raw) {
      return res.json({
        success: false,
        message: "Auth token is not supplied",
      });
    }

    return jwt.verify(raw, MyConstants.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.json({
          success: false,
          message: "Token is not valid",
        });
      }
      req.decoded = decoded;
      return next();
    });
  },
};

module.exports = JwtUtil;