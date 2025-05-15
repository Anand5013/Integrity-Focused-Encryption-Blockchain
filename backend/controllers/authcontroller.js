const { connectDB } = require('../config/db');
const { 
  web3, 
  recoverSigner, 
  calculateCredentialHash, 
  storeUserCredential, 
  getUserCredentialHash 
} = require('../utils/web3Utils');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const jwt = require('jsonwebtoken');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRY = "24h";

// In-memory storage for authentication messages (replace Redis)
const authMessages = new Map();

/**
 * Check if a user is already registered
 */
const checkUser = async (req, res) => {
  try {
    const { address } = req.params;

    if (!web3.utils.isAddress(address)) {
      return sendError(res, 400, "Invalid Ethereum address");
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      address: address.toLowerCase(),
    });

    if (user) {
      return sendSuccess(res, 200, "User is registered", {
        registered: true,
        role: user.role,
      });
    } else {
      return sendSuccess(res, 200, "User is not registered", {
        registered: false,
      });
    }
  } catch (error) {
    console.error("Error checking user:", error);
    return sendError(res, 500, "Server error when checking user registration");
  }
};

/**
 * Register a new user
 */
const registerUser = async (req, res) => {
  try {
    const { address, username, role, permissions } = req.body;

    // Validate input
    if (!address || !username || !role || !permissions) {
      return sendError(res, 400, "Missing required fields");
    }

    if (!web3.utils.isAddress(address)) {
      return sendError(res, 400, "Invalid Ethereum address");
    }

    if (role !== "admin" && role !== "patient") {
      return sendError(res, 400, 'Role must be either "admin" or "patient"');
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      address: address.toLowerCase(),
    });
    if (existingUser) {
      return sendError(
        res,
        409,
        "User with this address is already registered"
      );
    }

    // Create new user
    const newUser = {
      address: address.toLowerCase(),
      username,
      role,
      permissions,
      createdAt: new Date(),
    };

    await usersCollection.insertOne(newUser);
    console.log(`User ${username} (${address}) registered in MongoDB.`);

    // --- Blockchain Interaction ---
    try {
      // Determine sender address (needs ETH for gas)
      // Prioritize environment variable, fallback to first account (dev only)
      let senderAddress = process.env.ADMIN_WALLET_ADDRESS;
      if (!senderAddress) {
        console.warn("ADMIN_WALLET_ADDRESS not set in environment. Falling back to web3.eth.getAccounts()[0]. This is suitable for local development only.");
        const accounts = await web3.eth.getAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error("No Ethereum accounts available to send transaction.");
        }
        senderAddress = accounts[0];
        console.log(`Using sender address: ${senderAddress}`);
      } else {
         console.log(`Using admin sender address from env: ${senderAddress}`);
      }


      console.log(`Attempting to store credential on blockchain for ${address}...`);
      await storeUserCredential(
        newUser.address, // Use the lowercase address stored in DB
        newUser.username,
        newUser.role,
        newUser.permissions,
        senderAddress
      );
      console.log(`Blockchain credential stored successfully for ${address}.`);

    } catch (blockchainError) {
      console.error(`Failed to store credential on blockchain for ${address}:`, blockchainError.message);
      // Decide on error handling: 
      // Option 1: Log error and continue (user registered in DB but not BC) - Current approach
      // Option 2: Rollback DB entry (more complex)
      // Option 3: Return an error to the client
      // For now, we log the error but still return success for the DB registration.
      // Consider adding a status field to the user document in future.
      return sendSuccess(res, 201, "User registered in database, but failed to sync with blockchain.", {
        address: newUser.address,
        username: newUser.username,
        role: newUser.role,
        blockchainSyncError: blockchainError.message // Inform client optionally
      });
    }
    // --- End Blockchain Interaction ---


    return sendSuccess(res, 201, "User registered successfully and synced with blockchain", {
      address: newUser.address, // Use consistent address format
      username,
      role,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return sendError(res, 500, "Server error during registration");
  }
};

/**
 * Authenticate user with signature
 */
const authenticateUser = async (req, res) => {
  try {
    const { address, signature } = req.body;
    
    if (!address || !signature) {
      return sendError(res, 400, "Missing required fields");
    }

    // Get the message from in-memory storage
    const message = authMessages.get(address.toLowerCase());
    
    if (!message) {
      return sendError(res, 400, "No authentication request found");
    }

    console.log(`[authenticateUser] Received for ${address}: "${message}"`);

    // Use the recoverSigner utility from web3Utils - now properly awaiting the Promise
    const recoveredAddress = await recoverSigner(message, signature);
    
    if (!recoveredAddress) {
      return sendError(res, 401, "Failed to recover address from signature");
    }

    console.log(`[authenticateUser] Recovered address: ${recoveredAddress}`);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      console.log(`[authenticateUser] Signature verification failed: Recovered "${recoveredAddress}" != Expected "${address}"`);
      return sendError(res, 401, "Invalid signature");
    }

    // Get user from database
    const db = await connectDB();
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({
      address: address.toLowerCase(),
    });

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // --- Blockchain Hash Verification ---
    try {
      console.log(`Verifying data integrity for user ${user.address}...`);
      const calculatedHash = calculateCredentialHash(user.username, user.role, user.permissions);
      const storedHash = await getUserCredentialHash(user.address);

      console.log(`Calculated hash from DB data: ${calculatedHash}`);
      console.log(`Stored hash from Blockchain:    ${storedHash}`);

      if (!storedHash) {
         console.error(`Data integrity check failed: No credential hash found on blockchain for ${user.address}.`);
         // This could mean the registration blockchain step failed or the record was removed.
         return sendError(res, 401, "Authentication failed: User record inconsistency (missing blockchain data). Please contact support.");
      }

      if (calculatedHash !== storedHash) {
        console.error(`Data integrity check FAILED for ${user.address}. Hashes do not match.`);
        // This indicates potential tampering in the database OR an issue during registration/update.
        return sendError(res, 401, "Authentication failed: Data integrity verification failed. Credentials may have been altered.");
      }

      console.log(`Data integrity verification successful for ${user.address}.`);

    } catch (verificationError) {
       console.error(`Error during blockchain hash verification for ${user.address}:`, verificationError);
       return sendError(res, 500, "Server error during security verification.");
    }
    // --- End Blockchain Hash Verification ---


    // Generate JWT token if verification passes
    const token = jwt.sign(
      {
        address: user.address,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Clear the message from storage after successful authentication
    authMessages.delete(address.toLowerCase());

    return sendSuccess(res, 200, "Authentication successful", {
      token,
      user: {
        address: user.address,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return sendError(res, 500, "Server error during authentication");
  }
};

/**
 * Generate a message for signing (nonce-based)
 */
const generateMessage = async (req, res) => {
  try {
    const { address } = req.params;

    if (!web3.utils.isAddress(address)) {
      return sendError(res, 400, "Invalid Ethereum address");
    }

    // Generate a random nonce or timestamp to prevent replay attacks
    const nonce = Math.floor(Math.random() * 1000000);
    const timestamp = Date.now();

    // Create a message to sign
    const message = `Authenticate with InvisiCipher: ${nonce}-${timestamp}`;

    // Store in memory map instead of Redis
    authMessages.set(address.toLowerCase(), message);

    console.log(`[generateMessage] Generated for ${address}: "${message}"`);

    return sendSuccess(res, 200, "Message generated successfully", { message });
  } catch (error) {
    console.error("Error generating message:", error);
    return sendError(res, 500, "Server error when generating message");
  }
};

module.exports = {
  checkUser,
  registerUser,
  authenticateUser,
  generateMessage,
};
