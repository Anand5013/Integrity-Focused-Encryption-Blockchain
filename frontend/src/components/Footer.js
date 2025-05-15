import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5>InvisiCipher</h5>
            <p className="text-white-50">
              Secure medical image storage using steganography, encryption,
              IPFS, and blockchain.
            </p>
          </div>

          <div className="col-md-3">
            <h5>Links</h5>
            <ul className="list-unstyled">
              <li>
                <a href="/" className="text-white-50">
                  Home
                </a>
              </li>
              <li>
                <a href="/login" className="text-white-50">
                  Login
                </a>
              </li>
              <li>
                <a href="/register" className="text-white-50">
                  Register
                </a>
              </li>
            </ul>
          </div>

          <div className="col-md-3">
            <h5>Resources</h5>
            <ul className="list-unstyled">
              <li>
                <a
                  href="https://infura.io/docs/ipfs"
                  className="text-white-50"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  IPFS Docs
                </a>
              </li>
              <li>
                <a
                  href="https://metamask.io/"
                  className="text-white-50"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MetaMask
                </a>
              </li>
              <li>
                <a
                  href="https://ethereum.org/"
                  className="text-white-50"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ethereum
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="bg-secondary" />

        <div className="row">
          <div className="col text-center">
            <p className="mb-0 text-white-50">
              &copy; {year} InvisiCipher. Final Year Project.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
