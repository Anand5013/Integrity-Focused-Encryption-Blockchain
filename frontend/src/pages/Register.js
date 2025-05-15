import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertMessage from "../components/AlertMessage";

const Register = () => {
  const { register, isAuthenticated, login } = useAuth();
  const { account, connectWallet, isCorrectNetwork, switchNetwork } = useWeb3();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have an address from location state
  const initialAddress = location.state?.address || account;

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

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

  // Register user
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Determine permissions based on role
      const permissions =
        role === "admin"
          ? { canRead: true, canWrite: true, canDelete: true }
          : { canRead: true, canWrite: false, canDelete: false };

      // Register user
      await register({
        address: account,
        username,
        role,
        permissions,
      });

      setSuccess("Registration successful! Proceeding to login...");

      // Wait a moment then auto-login
      setTimeout(async () => {
        try {
          await login(account);
          // Navigation will happen automatically due to the authentication check
        } catch (loginErr) {
          setError(loginErr.message || "Login failed after registration");
          navigate("/login");
        }
      }, 2000);
    } catch (err) {
      setError(err.message || "Registration failed");
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
              <h2 className="card-title text-center mb-4">Register</h2>

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

              {!account ? (
                <div className="text-center mb-4">
                  <p>Connect your MetaMask wallet to register.</p>
                  <button
                    className="btn btn-primary"
                    onClick={handleConnect}
                    disabled={isLoading}
                  >
                    <i className="bi bi-wallet2 me-2"></i>
                    Connect MetaMask
                  </button>
                </div>
              ) : !isCorrectNetwork ? (
                <div className="text-center mb-4">
                  <p>Please switch to the correct network to continue.</p>
                  <button
                    className="btn btn-warning"
                    onClick={handleSwitchNetwork}
                    disabled={isLoading}
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Switch Network
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister}>
                  <div className="mb-3">
                    <label htmlFor="ethAddress" className="form-label">
                      Ethereum Address
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="ethAddress"
                      value={account}
                      disabled
                    />
                    <div className="form-text">Connected with MetaMask</div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      Username
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Role</label>
                    <div className="d-flex">
                      <div className="form-check me-4">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="role"
                          id="rolePatient"
                          value="patient"
                          checked={role === "patient"}
                          onChange={() => setRole("patient")}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="rolePatient"
                        >
                          Patient
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="role"
                          id="roleAdmin"
                          value="admin"
                          checked={role === "admin"}
                          onChange={() => setRole("admin")}
                        />
                        <label className="form-check-label" htmlFor="roleAdmin">
                          Administrator
                        </label>
                      </div>
                    </div>
                  </div>

                  {isLoading ? (
                    <LoadingSpinner message="Registering..." />
                  ) : (
                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary btn-lg">
                        Register
                      </button>
                    </div>
                  )}
                </form>
              )}

              <div className="text-center mt-4">
                <p>Already have an account?</p>
                <button
                  className="btn btn-link"
                  onClick={() => navigate("/login")}
                  disabled={isLoading}
                >
                  Login Here
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
