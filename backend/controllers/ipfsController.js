const { connectDB } = require("../config/db");
const { sendSuccess, sendError } = require("../utils/responseUtils");
const { uploadToIPFS, downloadFromIPFS } = require("../utils/ipfsUtils");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Temporary directory for storing downloaded files
const TEMP_DIR = path.join(__dirname, "..", "temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Upload a file to IPFS
 */
const uploadFile = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return sendError(res, 400, "No file uploaded");
    }

    const { address } = req.user;
    const { filename, originalname, path: filePath } = req.file;

    // Read the file buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Upload to IPFS
    const cid = await uploadToIPFS(fileBuffer, originalname);

    // Log the upload in database
    const db = await connectDB();
    const uploadsCollection = db.collection("ipfs_uploads");

    await uploadsCollection.insertOne({
      cid,
      originalFilename: originalname,
      tempFilename: filename,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: address,
      uploadedAt: new Date(),
    });

    // Clean up temporary file
    fs.unlinkSync(filePath);

    return sendSuccess(res, 200, "File uploaded to IPFS successfully", { cid });
  } catch (error) {
    console.error("IPFS upload error:", error);
    return sendError(res, 500, "Failed to upload file to IPFS");
  }
};

/**
 * Download a file from IPFS
 */
const downloadFile = async (req, res) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return sendError(res, 400, "IPFS CID is required");
    }

    // Generate a unique output path
    const outputPath = path.join(TEMP_DIR, `${uuidv4()}_${cid}`);

    // Download from IPFS
    await downloadFromIPFS(cid, outputPath);

    // Get file metadata if available
    const db = await connectDB();
    const uploadsCollection = db.collection("ipfs_uploads");
    const fileMetadata = await uploadsCollection.findOne({ cid });

    // Set appropriate file name and content type
    const fileName = fileMetadata?.originalFilename || `file_${cid}`;
    const contentType = fileMetadata?.contentType || "application/octet-stream";

    // Send file to client
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", contentType);

    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    // Clean up the file after sending (using event handlers)
    fileStream.on("end", () => {
      fs.unlinkSync(outputPath);
    });

    fileStream.on("error", (err) => {
      console.error("Error streaming file:", err);
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });
  } catch (error) {
    console.error("IPFS download error:", error);
    return sendError(res, 500, "Failed to download file from IPFS");
  }
};

/**
 * Get IPFS file information
 */
const getFileInfo = async (req, res) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return sendError(res, 400, "IPFS CID is required");
    }

    const db = await connectDB();
    const uploadsCollection = db.collection("ipfs_uploads");

    const fileInfo = await uploadsCollection.findOne({ cid });

    if (!fileInfo) {
      return sendError(res, 404, "File information not found");
    }

    return sendSuccess(res, 200, "File information retrieved successfully", {
      cid: fileInfo.cid,
      filename: fileInfo.originalFilename,
      contentType: fileInfo.contentType,
      size: fileInfo.size,
      uploadedBy: fileInfo.uploadedBy,
      uploadedAt: fileInfo.uploadedAt,
    });
  } catch (error) {
    console.error("Error retrieving file info:", error);
    return sendError(res, 500, "Failed to retrieve file information");
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  getFileInfo,
};
