/**
 * Check if a string is a valid Ethereum address
 * @param {string} address - Ethereum address to validate
 * @returns {boolean} - True if valid
 */
export const isValidEthAddress = (address) => {
  return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
};

/**
 * Check if a string is a valid IPFS CID
 * @param {string} cid - IPFS CID to validate
 * @returns {boolean} - True if valid
 */
export const isValidIpfsCid = (cid) => {
  // Basic CID validation - can be enhanced for specific CID versions
  return /^(Qm[1-9A-Za-z]{44}|bafy[a-zA-Z0-9]{50,})$/.test(cid);
};

/**
 * Check if a string is empty or whitespace only
 * @param {string} str - String to check
 * @returns {boolean} - True if empty
 */
export const isEmpty = (str) => {
  return !str || str.trim() === "";
};

/**
 * Check if a value is a valid number
 * @param {any} value - Value to check
 * @returns {boolean} - True if valid number
 */
export const isValidNumber = (value) => {
  if (typeof value === "number") return !isNaN(value);
  if (typeof value === "string") return !isNaN(Number(value));
  return false;
};

/**
 * Check if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};
