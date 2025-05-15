import React, { createContext, useState, useEffect, useContext } from "react";
import authService from "../services/authService";

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage on page load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is logged in
        if (authService.isLoggedIn()) {
          // Get user data from localStorage
          const userData = authService.getCurrentUser();

          // Set user and authentication state
          setUser(userData);
          setIsAuthenticated(true);

          // Verify token with backend (optional, for extra security)
          try {
            await authService.verifyToken();
          } catch (error) {
            // Token verification failed, log out
            console.error("Token verification failed:", error);
            await logout();
          }
        }
      } catch (error) {
        console.error("Authentication initialization error:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Connect to MetaMask and check user registration
   */
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Connect to MetaMask and get address
      const address = await authService.connectMetaMask();

      // Check if user is registered
      const registrationInfo = await authService.checkRegistration(address);

      return {
        address,
        isRegistered: registrationInfo.registered,
        role: registrationInfo.role,
      };
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register a new user
   */
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.registerUser(userData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with MetaMask
   */
  const login = async (address) => {
    try {
      setIsLoading(true);
      setError(null);
  
      // Get message from backend
      const { message } = await authService.getMessageToSign(address);
      
      console.log("Signing message:", message);
      
      // Sign with MetaMask's personal_sign
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });
  
      console.log("Got signature:", signature);
  
      try {
        // Send to backend
        const authData = await authService.authenticate(address, signature);
        
        // Ensure we have user data before updating state
        if (authData && authData.user) {
          // Update state
          setUser(authData.user);
          setIsAuthenticated(true);
          return authData;
        } else {
          throw new Error("Invalid authentication response");
        }
      } catch (error) {
        console.error("Authentication failed:", error);
        throw new Error(error.message || "Failed to authenticate with signature");
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout the current user
   */
  const logout = async () => {
    try {
      // Clear stored data
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");

      // Update state
      setUser(null);
      setIsAuthenticated(false);

      return true;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    connectWallet,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
