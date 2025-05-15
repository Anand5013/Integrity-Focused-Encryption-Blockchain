const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");
const { verifyToken } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set up multer for file uploads
const uploadDir = path.join(__dirname, "..", "temp", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

/**
 * @route   POST /api/images/hide
 * @desc    Hide a secret image in a cover image
 * @access  Private
 */
router.post(
  "/hide",
  verifyToken,
  upload.fields([
    { name: "cover_image", maxCount: 1 },
    { name: "secret_image", maxCount: 1 },
  ]),
  imageController.hideImage
);

/**
 * @route   POST /api/images/reveal
 * @desc    Reveal a hidden image from a stego image
 * @access  Private
 */
router.post(
  "/reveal",
  verifyToken,
  upload.single("stego_image"),
  imageController.revealImage
);

/**
 * @route   POST /api/images/encrypt
 * @desc    Encrypt an image
 * @access  Private
 */
router.post(
  "/encrypt",
  verifyToken,
  upload.single("image"),
  imageController.encryptImage
);

/**
 * @route   POST /api/images/decrypt
 * @desc    Decrypt an encrypted image
 * @access  Private
 */
// Add this route to your existing images routes
router.post(
  "/decrypt",
  verifyToken,
  upload.single("image"),
  imageController.decryptImage
);

/**
 * @route   GET /api/images/temp/:filename
 * @desc    Serve a temporary processed image
 * @access  Private
 */
router.get("/temp/:filename", verifyToken, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "..", "temp", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "Image not found",
    });
  }

  res.sendFile(filePath);
});

/**
 * @route   POST /api/images/save-stego-temp
 * @desc    Save a temporary stego image named with its corresponding IPFS CID
 * @access  Private (assuming only authenticated users, e.g., admin, should do this)
 */
router.post(
  "/save-stego-temp",
  verifyToken,
  upload.single("stego_image"), // Expects a file named 'stego_image'
  imageController.saveStegoTemp // Calls the new controller function
);


module.exports = router;
