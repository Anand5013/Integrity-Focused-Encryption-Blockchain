import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import MetaMaskButton from "./MetaMaskButton";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { account } = useWeb3();
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Format Ethereum address
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          InvisiCipher
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>

            {isAuthenticated && user?.role === "admin" && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin">
                  Admin Dashboard
                </Link>
              </li>
            )}

            {isAuthenticated && user?.role === "patient" && (
              <li className="nav-item">
                <Link className="nav-link" to="/patient">
                  Patient Dashboard
                </Link>
              </li>
            )}

            {!isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center">
            {/* Show wallet address if connected */}
            {account && (
              <span className="text-light me-3">{formatAddress(account)}</span>
            )}

            {/* MetaMask connect button */}
            <MetaMaskButton />

            {/* Logout button if authenticated */}
            {isAuthenticated && (
              <button
                className="btn btn-outline-danger ms-2"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
