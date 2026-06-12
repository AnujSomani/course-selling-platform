const jwt = require("jsonwebtoken");
const { JWT_SECRET_USER } = require("../config");

function userMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or malformed authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET_USER);
    req.userId = decoded.id;
    return next();
  } catch (e) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

module.exports = { userMiddleware };