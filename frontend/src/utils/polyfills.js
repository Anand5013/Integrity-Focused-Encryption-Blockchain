// Add any necessary polyfills for browser compatibility

// Buffer polyfill for working with IPFS (needed for some browsers)
if (typeof window !== "undefined" && !window.Buffer) {
  window.Buffer = require("buffer/").Buffer;
}

// Add a global error handler for uncaught promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Optionally report to an error tracking service
});

// Check for MetaMask and other prerequisites
const checkPrerequisites = () => {
  // Check for MetaMask
  const hasMetaMask = typeof window.ethereum !== "undefined";

  // Log prerequisites status (could be expanded to show UI warnings)
  console.log("Prerequisites check:", {
    metaMask: hasMetaMask ? "Available" : "Not detected",
  });

  return {
    hasMetaMask,
  };
};

// Run the prerequisites check
const prerequisites = checkPrerequisites();

// Export in case it's needed elsewhere
export default prerequisites;
