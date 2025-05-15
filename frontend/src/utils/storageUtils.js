/**
 * Get an item from localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} - Retrieved value or default
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error getting localStorage item ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Set an item in localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} - Success status
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage item ${key}:`, error);
    return false;
  }
};

/**
 * Remove an item from localStorage with error handling
 * @param {string} key - Storage key
 * @returns {boolean} - Success status
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage item ${key}:`, error);
    return false;
  }
};

/**
 * Clear all localStorage items with error handling
 * @returns {boolean} - Success status
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
};

/**
 * Storage keys used in the application
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_DATA: "user_data",
  THEME: "app_theme",
  LAST_LOGIN: "last_login",
};
