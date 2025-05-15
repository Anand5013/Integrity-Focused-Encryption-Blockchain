const { sendSuccess, sendError } = require("../utils/responseUtils");
const FormData = require("form-data");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Temporary directory for storing processed images
const TEMP_DIR = path.join(__dirname, "..", "temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Hide an image within another image (steganography)
 */
const hideImage = async (req, res) => {
  try {
    // Check if both cover and secret images were uploaded
    if (!req.files || !req.files.cover_image || !req.files.secret_image) {
      return sendError(res, 400, "Both cover and secret images are required");
    }

    const coverImagePath = req.files.cover_image[0].path;
    const secretImagePath = req.files.secret_image[0].path;

    // Create form data for Python service
    const form = new FormData();
    form.append("cover_image", fs.createReadStream(coverImagePath));
    form.append("secret_image", fs.createReadStream(secretImagePath));

    // Send to Python steganography service
    const stegoResponse = await fetch("http://127.0.0.1:5000/hide_image", {
      method: "POST",
      body: form,
    });

    const stegoResult = await stegoResponse.json();

    if (!stegoResult.success) {
      return sendError(res, 500, stegoResult.message || "Failed to hide image");
    }

    // Save the stego image to a temporary file
    const stegoImagePath = path.join(TEMP_DIR, `stego_${uuidv4()}.png`);
    fs.writeFileSync(
      stegoImagePath,
      Buffer.from(stegoResult.stego_image, "base64")
    );

    // Clean up input files
    fs.unlinkSync(coverImagePath);
    fs.unlinkSync(secretImagePath);

    // Send the path to the client
    return sendSuccess(res, 200, "Image hidden successfully", {
      imagePath: stegoImagePath,
      // Base64 representation can be included if needed
      imageBase64: stegoResult.stego_image,
    });
  } catch (error) {
    console.error("Image hiding error:", error);
    return sendError(res, 500, "Failed to process image hiding");
  }
};

/**
 * Reveal a hidden image from a stego image
 */
const revealImage = async (req, res) => {
  try {
    // Check if stego image was uploaded
    if (!req.file) {
      return sendError(res, 400, "Stego image is required");
    }

    const stegoImagePath = req.file.path;

    // Create form data for Python service
    const form = new FormData();
    form.append("steg_image", fs.createReadStream(stegoImagePath));

    // Send to Python steganography service
    const revealResponse = await fetch("http://127.0.0.1:5000/reveal_image", {
      method: "POST",
      body: form,
    });

    const revealResult = await revealResponse.json();

    if (!revealResult.success) {
      return sendError(
        res,
        500,
        revealResult.message || "Failed to reveal image"
      );
    }

    // Save the revealed image to a temporary file
    const revealedImagePath = path.join(TEMP_DIR, `revealed_${uuidv4()}.png`);
    fs.writeFileSync(
      revealedImagePath,
      Buffer.from(revealResult.revealed_image, "base64")
    );

    // Clean up input file
    fs.unlinkSync(stegoImagePath);

    // Send the path to the client
    return sendSuccess(res, 200, "Image revealed successfully", {
      imagePath: revealedImagePath,
      // Base64 representation can be included if needed
      imageBase64: revealResult.revealed_image,
    });
  } catch (error) {
    console.error("Image revealing error:", error);
    return sendError(res, 500, "Failed to process image revealing");
  }
};

/**
 * Encrypt an image
 */
const encryptImage = async (req, res) => {
  try {
    // Check if image was uploaded
    if (!req.file) {
      return sendError(res, 400, "Image file is required");
    }

    const imagePath = req.file.path;

    // Create form data for Python encryption service
    const form = new FormData();
    form.append("image", fs.createReadStream(imagePath));

    // Send to Python encryption service
    const encryptResponse = await fetch("http://127.0.0.1:5002/encrypt", {
      method: "POST",
      body: form,
    });

    const encryptResult = await encryptResponse.json();

    if (!encryptResult.success) {
      return sendError(
        res,
        500,
        encryptResult.message || "Failed to encrypt image"
      );
    }

    // Save the encrypted image to a temporary file
    const encryptedImagePath = path.join(TEMP_DIR, `encrypted_${uuidv4()}.png`);
    fs.writeFileSync(
      encryptedImagePath,
      Buffer.from(encryptResult.encrypted_image, "base64")
    );

    // Clean up input file
    fs.unlinkSync(imagePath);

    // Send the path to the client
    return sendSuccess(res, 200, "Image encrypted successfully", {
      imagePath: encryptedImagePath,
      // Base64 representation can be included if needed
      imageBase64: encryptResult.encrypted_image,
    });
  } catch (error) {
    console.error("Image encryption error:", error);
    return sendError(res, 500, "Failed to encrypt image");
  }
};

/**
 * Decrypt an image
 */
const decryptImage = async (req, res) => {
  try {
    // Check if encrypted image was uploaded
    if (!req.file) {
      return sendError(res, 400, "Encrypted image is required");
    }

    const encryptedImagePath = req.file.path;

    // Create form data for Python decryption service
    const form = new FormData();
    form.append("image", fs.createReadStream(encryptedImagePath));

    // Send to Python decryption service
    const decryptResponse = await fetch("http://127.0.0.1:5002/decrypt", {
      method: "POST",
      body: form,
    });

    const decryptResult = await decryptResponse.json();

    if (!decryptResult.success) {
      return sendError(
        res,
        500,
        decryptResult.message || "Failed to decrypt image"
      );
    }

    // Save the decrypted image to a temporary file
    const decryptedImagePath = path.join(TEMP_DIR, `decrypted_${uuidv4()}.png`);
    fs.writeFileSync(
      decryptedImagePath,
      Buffer.from(decryptResult.decrypted_image, "base64")
    );

    // Clean up input file
    fs.unlinkSync(encryptedImagePath);

    // Send the path to the client
    return sendSuccess(res, 200, "Image decrypted successfully", {
      imagePath: decryptedImagePath,
      // Base64 representation can be included if needed
      imageBase64: decryptResult.decrypted_image,
    });
  } catch (error) {
    console.error("Image decryption error:", error);
    return sendError(res, 500, "Failed to decrypt image");
  }
};

/**
 * Saves a temporary stego image file named using the provided CID.
 * Expects 'stego_image' file and 'cid' in the request body/form-data.
 */
const saveStegoTemp = async (req, res) => {
  try {
    // Check if stego image and CID were provided
    if (!req.file) {
      return sendError(res, 400, "Stego image file is required");
    }
    if (!req.body || !req.body.cid) {
      // Clean up uploaded file if CID is missing
      fs.unlinkSync(req.file.path);
      return sendError(res, 400, "IPFS CID is required");
    }

    const tempStegoPath = req.file.path;
    const cid = req.body.cid;

    // Validate CID format (basic check)
    if (!cid.startsWith("Qm") || cid.length < 46) {
       fs.unlinkSync(tempStegoPath);
       return sendError(res, 400, "Invalid IPFS CID format provided");
    }

    // Construct the new filename using the CID
    const newFilename = `stego_${cid}.png`;
    const newPath = path.join(TEMP_DIR, newFilename);

    // Rename (move) the uploaded file to the new path
    fs.rename(tempStegoPath, newPath, (err) => {
      if (err) {
        console.error("Error renaming temp stego file:", err);
        // Attempt to clean up original file if rename fails
        try {
          fs.unlinkSync(tempStegoPath);
        } catch (cleanupErr) {
          console.error("Error cleaning up original temp file:", cleanupErr);
        }
        return sendError(res, 500, "Failed to save temporary stego image");
      }

      // Successfully saved
      return sendSuccess(res, 200, "Temporary stego image saved successfully", {
        filename: newFilename,
        path: newPath,
      });
    });
  } catch (error) {
    console.error("Save stego temp error:", error);
    // Ensure temp file is cleaned up on error if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
       try {
         fs.unlinkSync(req.file.path);
       } catch (cleanupErr) {
         console.error("Error cleaning up temp file on catch:", cleanupErr);
       }
    }
    return sendError(res, 500, "Failed to process saving temporary stego image");
  }
};


module.exports = {
  hideImage,
  revealImage,
  encryptImage,
  decryptImage,
  saveStegoTemp, // Add the new function here
};
