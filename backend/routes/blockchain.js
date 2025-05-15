const express = require("express");
const router = express.Router();
const blockchainController = require("../controllers/blockchainController");
const { verifyToken, isAdmin, isAdminOrSelf } = require("../middleware/auth");

/**
 * @route   POST /api/blockchain/store
 * @desc    Store an IPFS hash on the blockchain
 * @access  Private/Admin
 */
router.post("/store", verifyToken, isAdmin, blockchainController.storeIPFSHash);

/**
 * @route   GET /api/blockchain/records/:patientAddress
 * @desc    Get all IPFS hashes for a patient
 * @access  Private/Admin or Self
 */
router.get(
  "/records/:patientAddress",
  verifyToken,
  isAdminOrSelf,
  blockchainController.getPatientRecords
);

/**
 * @route   GET /api/blockchain/contract
 * @desc    Get contract address and network information
 * @access  Public
 */
router.get("/contract", blockchainController.getContractAddress);

module.exports = router;
