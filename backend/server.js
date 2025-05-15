const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const { createErrorResponse } = require('./utils/responseUtils');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Update the CORS configuration to:
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/ipfs", require("./routes/ipfs"));
// Ensure images routes are mounted at /api/images
app.use("/api/images", require("./routes/images"));
app.use("/api/blockchain", require("./routes/blockchain"));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Error handling middleware
// Add this error handling middleware before your routes
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json(createErrorResponse(400, 'Invalid JSON format'));
  }
  next();
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  // Close database connections or other resources
  const { closeDB } = require("./config/db");
  closeDB().then(() => {
    console.log("Server shut down successfully");
    process.exit(0);
  });
});

module.exports = app;
