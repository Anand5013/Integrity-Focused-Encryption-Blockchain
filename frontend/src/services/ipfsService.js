import api, { apiUtils } from "./api";

/**
 * Upload a file to IPFS
 * @param {File} file - File to upload
 * @returns {Promise<Object>} - Response with IPFS CID
 */
const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/ipfs/upload", formData, {
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
 * Get file info from IPFS
 * @param {string} cid - IPFS CID
 * @returns {Promise<Object>} - Response with file info
 */
const getFileInfo = async (cid) => {
  try {
    const response = await api.get(`/ipfs/info/${cid}`);
    return apiUtils.extractData(response);
  } catch (error) {
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Generate download URL for a file on IPFS
 * @param {string} cid - IPFS CID
 * @returns {string} - Download URL
 */
const getDownloadUrl = (cid) => {
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  return `${baseUrl}/api/ipfs/download/${cid}`;
};

/**
 * Download a file from IPFS by CID
 * @param {string} cid - IPFS CID
 * @returns {Promise<Blob>} - File blob
 */
const downloadFile = async (cid) => {
  try {
    const response = await api.get(`/ipfs/download/${cid}`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error("IPFS download error:", error);
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

// Replace or add this method to your ipfsService
export default {
  uploadFile,
  getFileInfo,
  getDownloadUrl,
  downloadFile,
  // Remove this method if it exists as it's causing the issue
  getDownloadUrl: (cid) => `http://localhost:5000/api/ipfs/download/${cid}`,
};
