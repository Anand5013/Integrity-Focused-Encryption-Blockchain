import React from "react";
import PropTypes from "prop-types";

const LoadingSpinner = ({
  size = "md",
  message = "Loading...",
  fullPage = false,
}) => {
  // Map size to CSS classes
  const sizeMap = {
    sm: "spinner-border-sm",
    md: "",
    lg: "spinner-border-lg",
  };

  const spinnerClass = `spinner-border ${sizeMap[size] || ""}`;

  if (fullPage) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-light bg-opacity-75 z-index-1000">
        <div className="text-center">
          <div className={spinnerClass} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          {message && <p className="mt-2">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center my-3">
      <div className={spinnerClass} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  message: PropTypes.string,
  fullPage: PropTypes.bool,
};

export default LoadingSpinner;
