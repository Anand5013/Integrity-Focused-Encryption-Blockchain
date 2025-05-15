const { Web3 } = require("web3");
const ethUtil = require("ethereumjs-util");
const fs = require("fs");
const path = require("path");

// --- Web3 Initialization ---
// TODO: Consider moving provider URL to environment variables
const providerUrl = process.env.WEB3_PROVIDER_URL || "http://127.0.0.1:8545";
const web3 = new Web3(providerUrl);

// --- Contract Loading ---
let userCredentialChainContract;
let contractAddress;
let contractAbi;

try {
  const contractJsonPath = path.resolve(
    __dirname,
    "../../blockchain/build/contracts/UserCredentialChain.json"
  );
  if (!fs.existsSync(contractJsonPath)) {
    throw new Error(`Contract JSON file not found at ${contractJsonPath}`);
  }
  const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, "utf8"));
  // TODO: Consider moving network ID to environment variables
  const networkId = process.env.WEB3_NETWORK_ID || "1337";
  contractAddress = contractJson.networks[networkId]?.address;
  contractAbi = contractJson.abi;

  if (!contractAddress) {
    throw new Error(
      `Contract not deployed on network ID ${networkId}. Check blockchain/build/contracts/UserCredentialChain.json`
    );
  }
  if (!contractAbi) {
    throw new Error(`Contract ABI not found in ${contractJsonPath}`);
  }

  userCredentialChainContract = new web3.eth.Contract(
    contractAbi,
    contractAddress
  );
  console.log(
    `UserCredentialChain contract loaded successfully at address: ${contractAddress}`
  );
} catch (error) {
  console.error("Failed to load UserCredentialChain contract:", error.message);
  // Depending on the application's needs, you might want to exit or handle this differently
  // For now, we'll log the error and let the functions fail if the contract isn't loaded.
  userCredentialChainContract = null;
}

// --- Helper Functions ---

/**
 * Calculates the Keccak256 hash of user credentials.
 * Matches the hashing logic expected by the UserCredentialChain contract and the prototype.
 * @param {string} username
 * @param {string} role
 * @param {object} permissions
 * @returns {string} The Keccak256 hash.
 */
const calculateCredentialHash = (username, role, permissions) => {
  try {
    const permissionsStr = JSON.stringify(permissions || {}); // Ensure permissions is always a string
    const permissionsBytes = web3.utils.utf8ToHex(permissionsStr);
    // Use encodePacked to match Solidity's abi.encodePacked
    const packedData = web3.utils.encodePacked(
      { value: username, type: "string" },
      { value: role, type: "string" },
      { value: permissionsBytes, type: "bytes" }
    );
    return web3.utils.keccak256(packedData);
  } catch (error) {
    console.error("Error calculating credential hash:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

/**
 * Stores user credentials hash on the blockchain.
 * @param {string} userWalletAddress - The address of the user being registered.
 * @param {string} username
 * @param {string} role
 * @param {object} permissions
 * @param {string} senderAddress - The address sending the transaction (e.g., admin or deployer).
 * @returns {Promise<object>} The transaction receipt.
 */
const storeUserCredential = async (
  userWalletAddress,
  username,
  role,
  permissions,
  senderAddress
) => {
  if (!userCredentialChainContract) {
    throw new Error("UserCredentialChain contract is not loaded.");
  }
  if (!web3.utils.isAddress(senderAddress)) {
    throw new Error("Invalid sender address provided for storing credential.");
  }
  if (!web3.utils.isAddress(userWalletAddress)) {
    throw new Error(
      "Invalid user wallet address provided for storing credential."
    );
  }

  try {
    const permissionsStr = JSON.stringify(permissions || {});
    const permissionsBytes = web3.utils.utf8ToHex(permissionsStr);

    console.log(
      `Storing credential for ${userWalletAddress} with username: ${username}, role: ${role}`
    );

    // Estimate gas before sending
    const gasEstimate = await userCredentialChainContract.methods
      .storeCredential(userWalletAddress, username, role, permissionsBytes)
      .estimateGas({ from: senderAddress });

    // Fetch current gas price for legacy transaction compatibility
    const currentGasPrice = await web3.eth.getGasPrice();
    console.log(`Using gasPrice: ${currentGasPrice} and gasLimit: ${gasEstimate}`);

    const tx = await userCredentialChainContract.methods
      .storeCredential(userWalletAddress, username, role, permissionsBytes)
      .send({ 
        from: senderAddress, 
        gas: gasEstimate, // Gas limit
        gasPrice: currentGasPrice // Explicitly set gas price for non-EIP1559 networks
      }); 

    console.log(
      `Credential stored on blockchain. Tx hash: ${tx.transactionHash}`
    );
    return tx;
  } catch (error) {
    console.error("Error storing user credential on blockchain:", error);
    throw error; // Re-throw to be handled by the controller
  }
};

/**
 * Retrieves the stored credential hash for a user from the blockchain.
 * @param {string} userWalletAddress - The address of the user.
 * @returns {Promise<string|null>} The stored hash, or null if not found or error.
 */
const getUserCredentialHash = async (userWalletAddress) => {
  if (!userCredentialChainContract) {
    throw new Error("UserCredentialChain contract is not loaded.");
  }
  if (!web3.utils.isAddress(userWalletAddress)) {
    console.error("Invalid user wallet address provided for retrieving hash.");
    return null; // Or throw an error
  }

  try {
    console.log(
      `Retrieving blockchain record for wallet: ${userWalletAddress}`
    );
    // The contract returns a struct: struct UserRecord { string username; string role; bytes permissions; bytes32 recordHash; }
    // Solidity returns structs as arrays by default in web3.js v1.x unless specified otherwise.
    // The hash is the 4th element (index 3).
    const storedRecord = await userCredentialChainContract.methods
      .getUserRecord(userWalletAddress)
      .call();

    // Access the hash (index 3 based on struct order)
    const storedHash = storedRecord[3];

    if (
      storedHash &&
      storedHash !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      console.log(
        `Found blockchain hash for ${userWalletAddress}: ${storedHash}`
      );
      return storedHash;
    } else {
      console.log(
        `No blockchain record found for ${userWalletAddress} or hash is zero.`
      );
      return null; // No record found or hash is zero
    }
  } catch (error) {
    console.error(
      `Error retrieving user credential hash for ${userWalletAddress}:`,
      error
    );
    // Depending on requirements, might return null or throw
    return null;
  }
};

/**
 * Recover the signer address from a signed message using pure JS libraries.
 * This doesn't require a connection to an Ethereum node
 *
 * @param {string} message - Original message that was signed
 * @param {string} signature - Signature produced by signing the message
 * @returns {string} - Address of the signer
 */
const recoverSigner = (message, signature) => {
  try {
    // Format the message as Ethereum signed message (this is how MetaMask formats it)
    const prefix = "\x19Ethereum Signed Message:\n" + message.length;
    const msgBuffer = Buffer.from(prefix + message);
    const msgHash = ethUtil.keccak256(msgBuffer);

    // Get signature components
    const sigParams = ethUtil.fromRpcSig(signature);

    // Recover public key
    const publicKey = ethUtil.ecrecover(
      msgHash,
      sigParams.v,
      sigParams.r,
      sigParams.s
    );

    // Get address from public key
    const addressBuffer = ethUtil.publicToAddress(publicKey);
    const address = ethUtil.bufferToHex(addressBuffer);

    return address;
  } catch (error) {
    console.error("Error recovering signer:", error);
    return null;
  }
};

module.exports = {
  web3,
  recoverSigner,
  calculateCredentialHash,
  storeUserCredential,
  getUserCredentialHash,
  // Export contract instance and address if needed elsewhere, though utils functions are preferred
  // userCredentialChainContract,
  // contractAddress
};
