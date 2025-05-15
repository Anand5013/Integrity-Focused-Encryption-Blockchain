import axios from "axios";

// Base API URL - can be overridden by environment variable
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor - add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If token expired and we're not trying to refresh it, log out the user
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");

      // If we're not on login page, redirect to login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Utility functions for working with the API
 */
export const apiUtils = {
  /**
   * Extract data from API response
   */
  extractData: (response) => {
    return response.data?.data || response.data;
  },

  /**
   * Extract error message from API error
   */
  extractErrorMessage: (error) => {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Unknown error occurred"
    );
  },
};

export default api;
