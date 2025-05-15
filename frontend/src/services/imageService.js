import api, { apiUtils } from "./api";

/**
 * Hide a secret image within a cover image
 * @param {File} coverImage - Cover image file
 * @param {File} secretImage - Secret image file
 * @returns {Promise<Object>} - Response with resulting image
 */
const hideImage = async (coverImage, secretImage) => {
  try {
    const formData = new FormData();
    formData.append("cover_image", coverImage);
    formData.append("secret_image", secretImage);

    const response = await api.post("/images/hide", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return apiUtils.extractData(response);
  } catch (error) {
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Reveal a hidden image from a stego image
 * @param {File} stegoImage - Stego image file
 * @returns {Promise<Object>} - Response with revealed image
 */
const revealImage = async (stegoImage) => {
  try {
    const formData = new FormData();
    formData.append("stego_image", stegoImage);

    const response = await api.post("/images/reveal", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return apiUtils.extractData(response);
  } catch (error) {
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Encrypt an image
 * @param {File} image - Image file to encrypt
 * @returns {Promise<Object>} - Response with encrypted image
 */
const encryptImage = async (image) => {
  try {
    const formData = new FormData();
    formData.append("image", image);

    const response = await api.post("/images/encrypt", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return apiUtils.extractData(response);
  } catch (error) {
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Decrypt an image
 * @param {File} image - Encrypted image file
 * @returns {Promise<Object>} - Response with decrypted image
 */
const decryptImage = async (image) => {
  try {
    const formData = new FormData();
    formData.append("image", image);

    // Correct endpoint with /images prefix
    const response = await api.post("/images/decrypt", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return apiUtils.extractData(response);
  } catch (error) {
    console.error("Image decryption error:", error, error.response);
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Get temporary image URL from filename
 * @param {string} filename - Filename of temp image
 * @returns {string} - Full URL to the temporary image
 */
const getTempImageUrl = (filename) => {
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  return `${baseUrl}/api/images/temp/${filename}`;
};

/**
 * Fetch a temporary image file from the backend
 * @param {string} filename - Filename of the temp image
 * @returns {Promise<File>} - The fetched image as a File object
 */
const fetchTempImage = async (filename) => {
  try {
    const imageUrl = getTempImageUrl(filename);
    // Use api.get with responseType 'blob' to handle binary data
    const response = await api.get(imageUrl, {
      responseType: "blob",
    });

    // Create a File object from the blob
    const imageBlob = response.data; // Axios wraps blob in data
    const imageFile = new File([imageBlob], filename, { type: imageBlob.type });
    return imageFile;
  } catch (error) {
    console.error("Error fetching temp image:", error);
    // Rethrow a more specific error or the original one
    throw new Error(
      `Failed to fetch temporary image ${filename}: ${apiUtils.extractErrorMessage(
        error
      )}`
    );
  }
};

/**
 * Send the original stego image and its corresponding encrypted IPFS CID
 * to the backend to save it temporarily with the correct name.
 * @param {File} stegoImageFile - The original (unencrypted) stego image file.
 * @param {string} cid - The IPFS CID of the *encrypted* version of this stego image.
 * @returns {Promise<Object>} - Response from the backend.
 */
const saveTempStegoImageWithCID = async (stegoImageFile, cid) => {
  try {
    const formData = new FormData();
    formData.append("stego_image", stegoImageFile);
    formData.append("cid", cid);

    const response = await api.post("/images/save-stego-temp", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return apiUtils.extractData(response);
  } catch (error) {
    console.error("Error saving temp stego image with CID:", error);
    throw new Error(
      `Failed to save temporary stego image for CID ${cid}: ${apiUtils.extractErrorMessage(
        error
      )}`
    );
  }
};


const imageService = {
  hideImage,
  revealImage,
  encryptImage,
  decryptImage,
  getTempImageUrl,
  fetchTempImage,
  saveTempStegoImageWithCID, // Add the new service function
};

export default imageService;
