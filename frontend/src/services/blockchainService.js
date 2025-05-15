import api, { apiUtils } from "./api";
import Web3 from "web3";

// Add this at the top of your file
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Initialize web3 (will connect to MetaMask if available)
let web3;
if (window.ethereum) {
  web3 = new Web3(window.ethereum);
} else if (window.web3) {
  web3 = new Web3(window.web3.currentProvider);
} else {
  // Fallback to a public provider
  web3 = new Web3("https://mainnet.infura.io/v3/your-infura-key");
}

/**
 * Get contract instance
 * @param {Array} abi - Contract ABI
 * @param {string} address - Contract address
 * @returns {Object} - Contract instance
 */
const getContractInstance = (abi, address) => {
  return new web3.eth.Contract(abi, address);
};

/**
 * Get contract address and network information
 * @returns {Promise<Object>} - Contract information
 */
const getContractInfo = async () => {
  try {
    const response = await api.get("/blockchain/contract");
    return apiUtils.extractData(response);
  } catch (error) {
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Store IPFS hash on blockchain
 * @param {string} patientAddress - Patient Ethereum address
 * @param {string} cid - IPFS CID/hash
 * @returns {Promise<Object>} - Transaction information
 */
const storeIPFSHash = async (patientAddress, cid) => {
  try {
    const response = await api.post("/blockchain/store", {
      patientAddress,
      cid,
    });
    return apiUtils.extractData(response);
  } catch (error) {
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Get patient records (IPFS hashes)
 * @param {string} patientAddress - Patient Ethereum address
 * @returns {Promise<Array>} - List of IPFS hashes
 */
const getPatientRecords = async (patientAddress) => {
  try {
    const response = await api.get(`/blockchain/records/${patientAddress}`);
    return apiUtils.extractData(response);
  } catch (error) {
    throw new Error(apiUtils.extractErrorMessage(error));
  }
};

/**
 * Store IPFS hash directly on blockchain (client-side transaction)
 * @param {Object} contract - Contract instance
 * @param {string} patientAddress - Patient Ethereum address
 * @param {string} cid - IPFS CID/hash
 * @returns {Promise<Object>} - Transaction receipt
 */
const storeIPFSHashDirectly = async (contract, patientAddress, cid) => {
  try {
    // Get current user's address
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      throw new Error("No Ethereum accounts available");
    }

    // Send transaction
    const tx = await contract.methods.addIPFSHash(patientAddress, cid).send({
      from: accounts[0],
      gas: 500000,
    });

    return tx;
  } catch (error) {
    throw new Error(`Blockchain transaction failed: ${error.message}`);
  }
};

/**
 * Get network ID
 * @returns {Promise<number>} - Network ID
 */
const getNetworkId = async () => {
  return await web3.eth.net.getId();
};

/**
 * Change network in MetaMask
 * @param {number} networkId - Network ID to switch to
 * @returns {Promise<void>}
 */
const switchNetwork = async (networkId) => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: web3.utils.toHex(networkId) }],
    });
  } catch (error) {
    throw new Error(`Failed to switch network: ${error.message}`);
  }
};

const blockchainService = {
  web3,
  getContractInstance,
  getContractInfo,
  storeIPFSHash,
  getPatientRecords,
  storeIPFSHashDirectly,
  getNetworkId,
  switchNetwork,
};

export default blockchainService;
