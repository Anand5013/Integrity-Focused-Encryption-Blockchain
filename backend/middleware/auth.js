const jwt = require("jsonwebtoken");

// Secret key for JWT verification - should be moved to environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

/**
 * Middleware to verify JWT token from request headers
 */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided, authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Token is not valid" });
  }
};

/**
 * Middleware to check if user has admin role
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied: Admin role required" });
  }

  next();
};

/**
 * Middleware to check if user is a patient
 */
const isPatient = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  if (req.user.role !== "patient") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Patient role required",
    });
  }

  next();
};

/**
 * Middleware to check if user is either an admin or the owner of the resource
 * Requires the route to have a 'patientAddress' parameter
 */
const isAdminOrSelf = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  if (
    req.user.role === "admin" ||
    req.user.address.toLowerCase() === req.params.patientAddress.toLowerCase()
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied: Not authorized for this resource",
    });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isPatient,
  isAdminOrSelf,
};
