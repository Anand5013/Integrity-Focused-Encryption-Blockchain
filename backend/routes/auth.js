const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

/**
 * @route   GET /api/auth/check/:address
 * @desc    Check if a user is registered
 * @access  Public
 */
router.get("/check/:address", authController.checkUser);

/**
 * @route   GET /api/auth/message/:address
 * @desc    Generate a message for signing
 * @access  Public
 */
router.get("/message/:address", authController.generateMessage);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", authController.registerUser);

/**
 * @route   POST /api/auth/authenticate
 * @desc    Authenticate a user with signature
 * @access  Public
 */
router.post("/authenticate", authController.authenticateUser);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify current token and get user data
 * @access  Private
 */
router.get("/verify", verifyToken, (req, res) => {
  // If verifyToken middleware passes, user is authenticated
  const user = {
    address: req.user.address,
    username: req.user.username,
    role: req.user.role,
    permissions: req.user.permissions,
  };

  res.status(200).json({
    success: true,
    message: "Token is valid",
    data: { user },
  });
});

module.exports = router;
