const express = require("express");
const router = express.Router();
const ipfsController = require("../controllers/ipfsController");
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
 * @route   POST /api/ipfs/upload
 * @desc    Upload a file to IPFS
 * @access  Private
 */
router.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  ipfsController.uploadFile
);

/**
 * @route   GET /api/ipfs/download/:cid
 * @desc    Download a file from IPFS
 * @access  Private
 */
// Make sure the download route has the verifyToken middleware
router.get("/download/:cid", verifyToken, ipfsController.downloadFile);

/**
 * @route   GET /api/ipfs/info/:cid
 * @desc    Get information about a file on IPFS
 * @access  Private
 */
router.get("/info/:cid", verifyToken, ipfsController.getFileInfo);

module.exports = router;
