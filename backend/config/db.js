const { MongoClient } = require("mongodb");

// MongoDB connection URL - use environment variable or default to localhost
const url = process.env.MONGODB_URL || "mongodb://localhost:27017";
const dbName = "invisicipher";
let client;

/**
 * Connect to MongoDB database
 * @returns {Promise<Object>} MongoDB database instance
 */
async function connectDB() {
  if (!client) {
    client = await MongoClient.connect(url);
    console.log("Connected to MongoDB at", url);
  }
  return client.db(dbName);
}

/**
 * Close the MongoDB connection
 */
async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    console.log("MongoDB connection closed");
  }
}

module.exports = { 
  connectDB,
  closeDB
};