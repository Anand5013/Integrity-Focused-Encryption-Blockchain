import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { useAuth } from "../context/AuthContext";

const MetaMaskButton = () => {
  const {
    account,
    connectWallet,
    isCorrectNetwork,
    switchNetwork,
    expectedNetworkId,
    isLoading: web3Loading,
  } = useWeb3();

  const {
    isAuthenticated,
    connectWallet: authConnect,
    isLoading: authLoading,
  } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Determine if we're in a loading state
  const isLoading = web3Loading || authLoading || isConnecting;

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError("");

      // If MetaMask is not connected, connect it
      if (!account) {
        await connectWallet();
        return;
      }

      // If not on the correct network, prompt to switch
      if (!isCorrectNetwork) {
        await switchNetwork();
        return;
      }

      // If not authenticated, check registration
      if (!isAuthenticated) {
        const { address, isRegistered } = await authConnect();

        // If registered, go to login, otherwise registration
        if (isRegistered) {
          navigate("/login");
        } else {
          navigate("/register", { state: { address } });
        }
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  };

  // Determine button text based on state
  const getButtonText = () => {
    if (isLoading) return "Connecting...";
    if (!account) return "Connect MetaMask";
    if (!isCorrectNetwork) return `Switch to Network ${expectedNetworkId}`;
    if (!isAuthenticated) return "Proceed to Login";
    return "Connected";
  };

  // Determine button style
  const getButtonClass = () => {
    if (isLoading) return "btn-secondary";
    if (!account) return "btn-primary";
    if (!isCorrectNetwork) return "btn-warning";
    if (!isAuthenticated) return "btn-info";
    return "btn-success";
  };

  // Determine if button should be disabled
  const isButtonDisabled = () => {
    return isLoading || (account && isCorrectNetwork && isAuthenticated);
  };

  return (
    <div className="metamask-button">
      <button
        className={`btn ${getButtonClass()}`}
        onClick={handleConnect}
        disabled={isButtonDisabled()}
      >
        {getButtonText()}
      </button>

      {error && <div className="text-danger mt-2 small">{error}</div>}
    </div>
  );
};

export default MetaMaskButton;
