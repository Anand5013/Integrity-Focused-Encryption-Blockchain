const { create } = require('ipfs-http-client');
const fs = require("fs");
const path = require("path");

// Local IPFS client configuration
const ipfs = create({
  host: process.env.IPFS_HOST || "127.0.0.1",
  port: process.env.IPFS_PORT || 5001,
  protocol: process.env.IPFS_PROTOCOL || "http"
});

/**
 * Upload file to IPFS
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Original file name (for metadata)
 * @returns {Promise<string>} - IPFS CID of uploaded file
 */
const uploadToIPFS = async (fileBuffer, fileName) => {
  try {
    const file = {
      path: fileName,
      content: fileBuffer,
    };

    const result = await ipfs.add(file);
    return result.cid.toString();
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error("Failed to upload file to IPFS");
  }
};

/**
 * Download file from IPFS by CID
 * @param {string} cid - IPFS CID to download
 * @param {string} outputPath - Path to save the downloaded file
 * @returns {Promise<string>} - Path to saved file
 */
const downloadFromIPFS = async (cid, outputPath) => {
  try {
    const chunks = [];
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }

    const fileBuffer = Buffer.concat(chunks);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write file to disk
    fs.writeFileSync(outputPath, fileBuffer);

    return outputPath;
  } catch (error) {
    console.error("IPFS download error:", error);
    throw new Error("Failed to retrieve file from IPFS");
  }
};

module.exports = {
  ipfs,
  uploadToIPFS,
  downloadFromIPFS,
};
