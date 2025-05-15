import api, { apiUtils } from "./api";

/**
 * Check if a user is registered by Ethereum address
 * @param {string} address - Ethereum address
 * @returns {Promise<Object>} - Response with registration status
 */
const checkRegistration = async (address) => {
  try {
    const response = await api.get(`/auth/check/${address}`);
    return apiUtils.extractData(response);
  } catch (error) {
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Get a message to sign for authentication
 * @param {string} address - Ethereum address
 * @returns {Promise<Object>} - Response with message
 */
const getMessageToSign = async (address) => {
  try {
    const response = await api.get(`/auth/message/${address}`);
    return apiUtils.extractData(response);
  } catch (error) {
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Response with user data
 */
const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return apiUtils.extractData(response);
  } catch (error) {
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Authenticate with signature
 */
const authenticate = async (address, signature) => {
  try {
    const response = await api.post("/auth/authenticate", {
      address,
      signature,
    });
    
    // Store token and user data in localStorage
    const { token, user } = response.data.data;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_data", JSON.stringify(user));
    
    // Return the full response data
    return response.data.data;
  } catch (error) {
    console.error("Authentication error:", error);
    // Use extractErrorMessage consistent with other functions
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Verify current token
 * @returns {Promise<Object>} - Response with user data
 */
const verifyToken = async () => {
  try {
    const response = await api.get("/auth/verify");
    return apiUtils.extractData(response);
  } catch (error) {
    // Clear localStorage if token is invalid
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Sign a message using MetaMask
 * @param {string} message - Message to sign
 * @param {string} address - Ethereum address
 * @returns {Promise<string>} - Signature
 */
const signMessage = async (message, address) => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    // Request signature from user using the raw message string.
    // MetaMask's personal_sign should handle UTF-8 strings and apply EIP-191 prefixing.
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address], // Pass the original message string
    });

    return signature;
  } catch (error) {
    throw new Error(`Failed to sign message: ${error.message}`);
  }
};

/**
 * Connect to MetaMask and get accounts
 * @returns {Promise<string>} - Connected Ethereum address
 */
const connectMetaMask = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length === 0) {
      throw new Error("No Ethereum accounts found");
    }

    return accounts[0];
  } catch (error) {
    throw new Error(`Failed to connect to MetaMask: ${error.message}`);
  }
};

/**
 * Check if user is logged in
 * @returns {boolean} - True if user is logged in
 */
const isLoggedIn = () => {
  return !!localStorage.getItem("auth_token");
};

/**
 * Get current user data
 * @returns {Object|null} - User data or null if not logged in
 */
const getCurrentUser = () => {
  const userData = localStorage.getItem("user_data");
  return userData ? JSON.parse(userData) : null;
};

/**
 * Log out user
 */
const logout = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_data");
  window.location.href = "/login";
};

const authService = {
  checkRegistration,
  getMessageToSign,
  registerUser,
  authenticate,
  verifyToken,
  signMessage,
  connectMetaMask,
  isLoggedIn,
  getCurrentUser,
  logout,
};

export default authService;
