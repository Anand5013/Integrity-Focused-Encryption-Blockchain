module.exports = {
    networks: {
      development: {
        host: "127.0.0.1", // Localhost (Ganache default)
        port: 8545, // Ganache default port
        network_id: "*", // Match any network ID
      },
    },
    compilers: {
      solc: {
        version: "0.8.17", // Specify a version >= 0.8.0
        settings: {
          // Optional: Optimize compilation
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  };
  