import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertMessage from "../components/AlertMessage";

const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const { account, connectWallet, isCorrectNetwork, switchNetwork } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === "admin" ? "/admin" : "/patient";
      // Check if we're not already on the target page
      if (window.location.pathname !== redirectPath) {
        console.log(`Redirecting authenticated user to ${redirectPath}`);
        navigate(redirectPath);
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Connect to MetaMask
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError("");

      await connectWallet();
      setSuccess("Wallet connected successfully!");
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  // Switch network if needed
  const handleSwitchNetwork = async () => {
    try {
      setIsLoading(true);
      setError("");

      await switchNetwork();
      setSuccess("Network switched successfully!");
    } catch (err) {
      setError(err.message || "Failed to switch network");
    } finally {
      setIsLoading(false);
    }
  };

  // Login with MetaMask
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Authenticate with MetaMask
      const authData = await login(account);

      // Set success message
      setSuccess("Login successful!");

      // Navigate to the appropriate dashboard based on user role
      // Check if authData and authData.user exist before accessing role
      setTimeout(() => {
        // Safely access the role property with a fallback to 'patient'
        const userRole = authData?.user?.role || "patient";
        const redirectPath = userRole === "admin" ? "/admin" : "/patient";
        navigate(redirectPath);
      }, 500); // Small delay to ensure state updates before navigation
    } catch (err) {
      setError(err.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Login</h2>

              {error && (
                <AlertMessage
                  message={error}
                  type="danger"
                  onClose={() => setError("")}
                />
              )}

              {success && (
                <AlertMessage
                  message={success}
                  type="success"
                  onClose={() => setSuccess("")}
                  autoClose={true}
                />
              )}

              <div className="mb-4 text-center">
                <img src="/images/metamask.png" alt="MetaMask" height="80" />
                <p className="mt-3">
                  Login using your Ethereum wallet to access your secure medical
                  records.
                </p>
              </div>

              {isLoading ? (
                <LoadingSpinner message="Processing..." />
              ) : (
                <div className="d-grid gap-3">
                  {!account ? (
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleConnect}
                    >
                      <i className="bi bi-wallet2 me-2"></i>
                      Connect MetaMask
                    </button>
                  ) : !isCorrectNetwork ? (
                    <button
                      className="btn btn-warning btn-lg"
                      onClick={handleSwitchNetwork}
                    >
                      <i className="bi bi-arrow-repeat me-2"></i>
                      Switch Network
                    </button>
                  ) : (
                    <button
                      className="btn btn-success btn-lg"
                      onClick={handleLogin}
                    >
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Login with MetaMask
                    </button>
                  )}
                </div>
              )}

              <div className="text-center mt-4">
                <p>Don't have an account?</p>
                <button
                  className="btn btn-link"
                  onClick={() => navigate("/register")}
                >
                  Register Now
                </button>
              </div>
            </div>
          </div>

          <div className="card mt-4 shadow">
            <div className="card-body p-3">
              <h5 className="card-title">How to Login</h5>
              <ol className="mb-0">
                <li>Connect your MetaMask wallet</li>
                <li>Sign the authentication message when prompted</li>
                <li>You'll be redirected to your dashboard</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
