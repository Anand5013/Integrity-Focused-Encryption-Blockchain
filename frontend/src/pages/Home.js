import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MetaMaskButton from "../components/MetaMaskButton";

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="container py-5">
      <div className="row align-items-center">
        <div className="col-lg-6">
          <h1 className="display-4 fw-bold mb-4">InvisiCipher</h1>
          <p className="lead mb-4">
            Secure medical image storage using steganography, encryption, IPFS,
            and blockchain.
          </p>
          <p className="mb-4">
            InvisiCipher provides a secure way to store and share medical
            images, ensuring that sensitive patient data remains private while
            maintaining accessibility for authorized healthcare providers.
          </p>

          <div className="d-grid gap-2 d-md-flex mb-4">
            {!isAuthenticated ? (
              <>
                <MetaMaskButton />
                <Link to="/register" className="btn btn-outline-primary">
                  Register
                </Link>
              </>
            ) : (
              <Link
                to={user?.role === "admin" ? "/admin" : "/patient"}
                className="btn btn-primary"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* <div className="col-lg-6">
          <img
            src="/images/med-.png"
            alt="Medical data security"
            className="img-fluid rounded shadow-lg"
          />
        </div> */}
      </div>

      <div className="row mt-5 pt-5">
        <div className="col-12 text-center mb-4">
          <h2>How It Works</h2>
          <p className="lead">
            Our technology ensures your medical images remain private and secure
          </p>
        </div>

        <div className="col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-block mb-3">
                <i className="bi bi-image fs-1 text-primary"></i>
              </div>
              <h5 className="card-title">Steganography</h5>
              <p className="card-text">
                Hide sensitive medical images within normal-looking cover images
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 d-inline-block mb-3">
                <i className="bi bi-lock fs-1 text-success"></i>
              </div>
              <h5 className="card-title">Encryption</h5>
              <p className="card-text">
                Advanced encryption ensures images can only be viewed by
                authorized users
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="rounded-circle bg-info bg-opacity-10 p-3 d-inline-block mb-3">
                <i className="bi bi-hdd-network fs-1 text-info"></i>
              </div>
              <h5 className="card-title">IPFS Storage</h5>
              <p className="card-text">
                Distributed storage ensures availability and redundancy
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 d-inline-block mb-3">
                <i className="bi bi-diagram-3 fs-1 text-warning"></i>
              </div>
              <h5 className="card-title">Blockchain</h5>
              <p className="card-text">
                Immutable record-keeping ensures integrity and accountability
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
