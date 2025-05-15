const { web3 } = require("../utils/web3Utils");
const { sendSuccess, sendError } = require("../utils/responseUtils");
const { connectDB } = require("../config/db");
const fs = require("fs");
const path = require("path");

// Path to contract JSON ABI
const CONTRACT_JSON_PATH = path.join(
  __dirname,
  "..",
  "..",
  "blockchain",
  "build",
  "contracts",
  "ImageRecordChain.json"
);

/**
 * Get contract instance
 */
const getContract = () => {
  if (!fs.existsSync(CONTRACT_JSON_PATH)) {
    throw new Error(`Contract JSON not found at: ${CONTRACT_JSON_PATH}`);
  }

  const contractJson = JSON.parse(fs.readFileSync(CONTRACT_JSON_PATH));
  const networkId = "1337"; // Use the specific network ID from your Ganache
  const contractAddress = contractJson.networks[networkId]?.address;

  if (!contractAddress) {
    throw new Error(`Contract not deployed on network ${networkId}. Make sure to migrate your contracts to this network.`);
  }

  return new web3.eth.Contract(contractJson.abi, contractAddress);
};

/**
 * Store IPFS hash in blockchain
 */
/**
 * Store an IPFS hash on the blockchain
 */
const storeIPFSHash = async (req, res) => {
  try {
    const { patientAddress, cid } = req.body;

    if (!patientAddress || !cid) {
      return sendError(res, 400, "Patient address and IPFS CID are required");
    }

    if (!web3.utils.isAddress(patientAddress)) {
      return sendError(res, 400, "Invalid Ethereum address");
    }

    // Get contract instance using the existing getContract function
    const contract = getContract();
    
    // Use the first account from web3 as the admin address
    const accounts = await web3.eth.getAccounts();
    const adminAddress = accounts[0]; // First account is typically the admin in development
    
    // Call the storeIPFSHash method with legacy transaction format
    const receipt = await contract.methods
      .storeIPFSHash(patientAddress, cid)
      .send({ 
        from: adminAddress, 
        gas: 200000,
        // Explicitly use legacy transaction format
        type: '0x0',
        gasPrice: await web3.eth.getGasPrice()
      });

    // Log the transaction in database
    const db = await connectDB();
    const txCollection = db.collection("blockchain_transactions");

    await txCollection.insertOne({
      txHash: receipt.transactionHash,
      patientAddress,
      cid,
      blockNumber: receipt.blockNumber,
      timestamp: new Date(),
    });

    return sendSuccess(res, 200, "IPFS hash stored on blockchain", {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Blockchain storage error:", error);
    return sendError(res, 500, "Failed to store IPFS hash in blockchain");
  }
};

/**
 * Get IPFS hashes for a patient
 */
const getPatientRecords = async (req, res) => {
  try {
    const { patientAddress } = req.params;

    if (!patientAddress || !web3.utils.isAddress(patientAddress)) {
      return sendError(res, 400, "Invalid patient Ethereum address");
    }

    // Check access permissions (must be admin or patient themselves)
    const { address, role } = req.user;
    if (
      role !== "admin" &&
      address.toLowerCase() !== patientAddress.toLowerCase()
    ) {
      return sendError(
        res,
        403,
        "Not authorized to access this patient's records"
      );
    }

    // Try to get records from database first for efficiency
    const db = await connectDB();
    const recordsCollection = db.collection("medical_records");
    const records = await recordsCollection
      .find({
        patientAddress: patientAddress.toLowerCase(),
      })
      .toArray();

    // If found in database, return those
    if (records && records.length > 0) {
      const ipfsHashes = records.map((record) => ({
        cid: record.ipfsHash,
        storedBy: record.storedBy,
        storedAt: record.storedAt,
      }));

      return sendSuccess(res, 200, "Patient records retrieved from database", {
        ipfsHashes,
      });
    }

    // Otherwise, get from blockchain
    const contract = getContract();
    const ipfsHashes = await contract.methods
      .getIPFSHashes(patientAddress)
      .call();

    if (!ipfsHashes || ipfsHashes.length === 0) {
      return sendSuccess(res, 200, "No records found for this patient", {
        ipfsHashes: [],
      });
    }

    // Format results as objects
    const formattedResults = ipfsHashes.map((cid) => ({ cid }));

    return sendSuccess(res, 200, "Patient records retrieved from blockchain", {
      ipfsHashes: formattedResults,
    });
  } catch (error) {
    console.error("Error retrieving patient records:", error);
    return sendError(res, 500, "Failed to retrieve patient records");
  }
};

/**
 * Get contract address
 */
const getContractAddress = async (req, res) => {
  try {
    const contract = getContract();
    const address = contract.options.address;
    
    // Use the same network ID (1337) as in getContract function
    const networkId = "1337";
    
    // Create response data with string values
    const responseData = {
      address: address,
      networkId: networkId
    };

    return sendSuccess(res, 200, "Contract address retrieved", responseData);
  } catch (error) {
    console.error("Error retrieving contract address:", error);
    return sendError(res, 500, "Failed to retrieve contract address");
  }
};

module.exports = {
  storeIPFSHash,
  getPatientRecords,
  getContractAddress,
};
