import React, { createContext, useState, useEffect, useContext } from "react";
import Web3 from "web3";
import blockchainService from "../services/blockchainService";

// Create context
const Web3Context = createContext();

// Custom hook to use the web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expected network ID (e.g., Ganache = 5777, Goerli = 5)
  // Update network ID check to use hex format
  const EXPECTED_NETWORK_ID = "0x539"; // 1337 in hex

  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if MetaMask is installed
        if (window.ethereum) {
          // Create Web3 instance
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          // Set up event listeners for account and network changes
          window.ethereum.on("accountsChanged", handleAccountsChanged);
          window.ethereum.on("chainChanged", () => window.location.reload());

          // Get contract info
          const contractInfo = await blockchainService.getContractInfo();
          setContractAddress(contractInfo.address);

          // Try to get accounts (if user already connected)
          try {
            const accounts = await web3Instance.eth.getAccounts();
            if (accounts.length > 0) {
              setAccount(accounts[0]);
            }
          } catch (err) {
            // Silently fail - user needs to connect manually
            console.log("No accounts accessible without user action");
          }

          // Get current network
          // Get current network using chainId instead of net.getId()
          const chainId = await window.ethereum.request({ 
            method: 'eth_chainId' 
          });
          setNetworkId(parseInt(chainId, 16));
          setIsCorrectNetwork(chainId === EXPECTED_NETWORK_ID);

          // Update contract initialization to handle multiple networks
          if (chainId === EXPECTED_NETWORK_ID && contractInfo.address) {
            try {
              // Fetch contract JSON
              const response = await fetch("/contracts/ImageRecordChain.json");
              const contractJson = await response.json();

              // Create contract instance
              const contractInstance = new web3Instance.eth.Contract(
                contractJson.abi,
                contractInfo.address
              );

              setContract(contractInstance);
            } catch (err) {
              console.error("Failed to load contract ABI:", err);
              setError("Failed to load smart contract");
            }
          }
        } else {
          // No MetaMask
          setError(
            "MetaMask not installed. Please install MetaMask to use this application."
          );
        }
      } catch (err) {
        console.error("Web3 initialization error:", err);
        setError(err.message || "Failed to initialize Web3");
      } finally {
        setIsLoading(false);
      }
    };

    initializeWeb3();

    // Cleanup event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

  // Handle account changes in MetaMask
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected all accounts
      setAccount(null);
    } else {
      // User switched accounts
      setAccount(accounts[0]);
    }
  };

  /**
   * Connect wallet manually
   */
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!web3) {
        throw new Error("Web3 not initialized");
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No Ethereum accounts found");
      }

      setAccount(accounts[0]);
      return accounts[0];
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError(err.message || "Failed to connect wallet");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Switch to the correct network
   */
  const switchNetwork = async () => {
    try {
      setIsLoading(true);

      if (!web3) {
        throw new Error("Web3 not initialized");
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: EXPECTED_NETWORK_ID }],
      });

      // Network ID will be updated by the chainChanged event
      return true;
    } catch (err) {
      console.error("Failed to switch network:", err);
      setError(err.message || "Failed to switch network");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Store IPFS hash on blockchain
   */
  const storeIPFSHash = async (patientAddress, cid) => {
    try {
      setIsLoading(true);

      if (!web3 || !contract || !account) {
        throw new Error("Web3, contract, or account not initialized");
      }

      if (!isCorrectNetwork) {
        throw new Error("Please switch to the correct network");
      }

      // Call storeIPFSHash method from service
      const result = await blockchainService.storeIPFSHash(patientAddress, cid);
      return result;
    } catch (err) {
      console.error("Failed to store IPFS hash:", err);
      setError(err.message || "Failed to store IPFS hash");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get patient records from blockchain
   */
  const getPatientRecords = async (patientAddress) => {
    try {
      setIsLoading(true);

      if (!web3) {
        throw new Error("Web3 not initialized");
      }

      // Call getPatientRecords method from service
      const result = await blockchainService.getPatientRecords(patientAddress);
      return result;
    } catch (err) {
      console.error("Failed to get patient records:", err);
      setError(err.message || "Failed to get patient records");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    web3,
    account,
    networkId,
    isCorrectNetwork,
    contract,
    contractAddress,
    isLoading,
    error,
    expectedNetworkId: EXPECTED_NETWORK_ID,
    connectWallet,
    switchNetwork,
    storeIPFSHash,
    getPatientRecords,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export default Web3Context;
