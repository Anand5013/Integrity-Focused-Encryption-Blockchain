// Add this at the top of the file
BigInt.prototype.toJSON = function() { return this.toString(); };

const sendSuccess = (res, statusCode, message, data = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} error - Error details
 */
const sendError = (
  res,
  statusCode = 500,
  message = "Operation failed",
  error = null
) => {
  const response = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV !== "production") {
    response.error = error.toString();
  }

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array|string} errors - Validation errors
 */
const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors,
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
};
