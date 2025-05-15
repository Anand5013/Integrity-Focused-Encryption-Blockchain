/**
 * Format an Ethereum address to shortened form
 * @param {string} address - Full Ethereum address
 * @param {number} prefixLength - Number of characters to show at start (default: 6)
 * @param {number} suffixLength - Number of characters to show at end (default: 4)
 * @returns {string} - Formatted address
 */
export const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
  if (!address || typeof address !== "string") return "";
  if (address.length <= prefixLength + suffixLength) return address;

  return `${address.substring(0, prefixLength)}...${address.substring(
    address.length - suffixLength
  )}`;
};

/**
 * Format a timestamp to a readable date string
 * @param {number|string|Date} timestamp - Timestamp to format
 * @param {boolean} includeTime - Whether to include time (default: true)
 * @returns {string} - Formatted date string
 */
export const formatDate = (timestamp, includeTime = true) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (isNaN(date)) return "";

  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  };

  return date.toLocaleDateString(undefined, options);
};

/**
 * Format a file size in bytes to human-readable form
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
